/**
 * Lotka's law of scientific productivity (Lotka, 1926).
 *
 * The number of authors producing n publications is proportional to 1/n^a:
 *     f(n) = C / n^a
 * Taking logs gives a line  log f(n) = log C - a·log n , so we recover the
 * exponent `a` by ordinary least-squares on the log-log frequency spectrum.
 * For many scientific corpora a ≈ 2 ("inverse square law of productivity").
 */

import { linearRegression } from "./trends";

export interface LotkaFit {
  exponent: number; // a
  constant: number; // C
  r2: number;
  /** Observed productivity spectrum: authors who published exactly `papers` works. */
  spectrum: Array<{ papers: number; authors: number; predicted: number }>;
  totalAuthors: number;
}

/**
 * @param paperCountsPerAuthor one entry per author = how many papers they have.
 */
export function fitLotka(paperCountsPerAuthor: number[]): LotkaFit {
  // Build the frequency spectrum: how many authors have exactly n papers.
  const freq = new Map<number, number>();
  for (const n of paperCountsPerAuthor) {
    if (n <= 0) continue;
    freq.set(n, (freq.get(n) ?? 0) + 1);
  }

  const points = [...freq.entries()]
    .filter(([, authors]) => authors > 0)
    .map(([papers, authors]) => ({ x: Math.log(papers), y: Math.log(authors) }));

  const fit = linearRegression(points);
  const exponent = -fit.slope;
  const constant = Math.exp(fit.intercept);

  const spectrum = [...freq.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([papers, authors]) => ({
      papers,
      authors,
      predicted: Math.round(constant / papers ** exponent),
    }));

  return {
    exponent,
    constant,
    r2: fit.r2,
    spectrum,
    totalAuthors: paperCountsPerAuthor.filter((n) => n > 0).length,
  };
}
