/**
 * Kleinberg burst detection (Kleinberg, "Bursty and Hierarchical Structure in
 * Streams", KDD 2002), two-state discrete version.
 *
 * Given, per period t, a topic's publication count `r[t]` against the total
 * publication count `d[t]`, we model emission with a binomial whose expected
 * rate is either baseline (`p0 = ΣR/ΣD`) or an elevated "burst" rate
 * (`p1 = p0·s`). A Viterbi pass finds the minimum-cost state path, trading the
 * likelihood gain of the burst state against a transition cost `γ·ln(n)`.
 * Periods assigned to the burst state form the detected bursts.
 *
 * This surfaces *when* a research front accelerated — a signal far richer than
 * a raw count, and rarely seen in operational dashboards.
 */

export interface BurstPeriod {
  index: number;
  state: 0 | 1;
}

export interface BurstInterval {
  startIndex: number;
  endIndex: number;
  /** Accumulated log-likelihood advantage of the burst state over baseline. */
  weight: number;
}

export interface BurstResult {
  states: BurstPeriod[];
  intervals: BurstInterval[];
  baselineRate: number;
  burstRate: number;
}

const cost = (r: number, d: number, p: number): number => {
  // Negative log-likelihood of the binomial, dropping the state-independent
  // coefficient term (irrelevant to the arg-min).
  const eps = 1e-9;
  const pc = Math.min(1 - eps, Math.max(eps, p));
  return -(r * Math.log(pc) + (d - r) * Math.log(1 - pc));
};

export function detectBursts(
  counts: number[],
  totals: number[],
  opts: { scaling?: number; gamma?: number } = {},
): BurstResult {
  const n = counts.length;
  const scaling = opts.scaling ?? 2;
  const gamma = opts.gamma ?? 1;

  const sumR = counts.reduce((s, c) => s + c, 0);
  const sumD = totals.reduce((s, c) => s + c, 0);
  const p0 = sumD > 0 ? sumR / sumD : 0;
  const p1 = Math.min(0.9999, p0 * scaling);

  if (n === 0 || p0 === 0) {
    return { states: [], intervals: [], baselineRate: p0, burstRate: p1 };
  }

  const transition = gamma * Math.log(Math.max(2, n));

  // Viterbi over two states.
  const dp: number[][] = Array.from({ length: n }, () => [0, 0]);
  const back: number[][] = Array.from({ length: n }, () => [0, 0]);

  for (let s = 0; s < 2; s++) {
    const p = s === 0 ? p0 : p1;
    dp[0]![s] = cost(counts[0] ?? 0, totals[0] ?? 0, p) + (s === 1 ? transition : 0);
  }

  for (let t = 1; t < n; t++) {
    for (let s = 0; s < 2; s++) {
      const p = s === 0 ? p0 : p1;
      const emit = cost(counts[t] ?? 0, totals[t] ?? 0, p);
      let bestPrev = 0;
      let bestCost = Infinity;
      for (let sp = 0; sp < 2; sp++) {
        const tau = s > sp ? (s - sp) * transition : 0;
        const c = dp[t - 1]![sp]! + tau + emit;
        if (c < bestCost) { bestCost = c; bestPrev = sp; }
      }
      dp[t]![s] = bestCost;
      back[t]![s] = bestPrev;
    }
  }

  // Backtrack.
  const states: (0 | 1)[] = new Array(n).fill(0);
  states[n - 1] = (dp[n - 1]![0]! <= dp[n - 1]![1]! ? 0 : 1) as 0 | 1;
  for (let t = n - 1; t > 0; t--) {
    states[t - 1] = back[t]![states[t]!]! as 0 | 1;
  }

  // Extract burst intervals and their weights.
  const intervals: BurstInterval[] = [];
  let start = -1;
  let weight = 0;
  for (let t = 0; t < n; t++) {
    if (states[t] === 1) {
      if (start === -1) { start = t; weight = 0; }
      weight += cost(counts[t] ?? 0, totals[t] ?? 0, p0) - cost(counts[t] ?? 0, totals[t] ?? 0, p1);
    } else if (start !== -1) {
      intervals.push({ startIndex: start, endIndex: t - 1, weight });
      start = -1;
    }
  }
  if (start !== -1) intervals.push({ startIndex: start, endIndex: n - 1, weight });

  return {
    states: states.map((state, index) => ({ index, state })),
    intervals,
    baselineRate: p0,
    burstRate: p1,
  };
}
