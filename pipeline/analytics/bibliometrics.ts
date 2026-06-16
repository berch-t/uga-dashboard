/**
 * Citation-based indicators.
 *
 *  - h-index   : Hirsch, PNAS 2005 — largest h such that h papers have >= h citations.
 *  - g-index   : Egghe, Scientometrics 2006 — largest g such that the top g papers
 *                together have >= g^2 citations (rewards highly-cited work).
 *  - i10-index : Google Scholar — number of papers with >= 10 citations.
 */

export function hIndex(citations: number[]): number {
  const sorted = [...citations].sort((a, b) => b - a);
  let h = 0;
  for (let i = 0; i < sorted.length; i++) {
    if ((sorted[i] ?? 0) >= i + 1) h = i + 1;
    else break;
  }
  return h;
}

export function gIndex(citations: number[]): number {
  const sorted = [...citations].sort((a, b) => b - a);
  let cumulative = 0;
  let g = 0;
  for (let i = 0; i < sorted.length; i++) {
    cumulative += sorted[i] ?? 0;
    if (cumulative >= (i + 1) * (i + 1)) g = i + 1;
    else break;
  }
  return g;
}

export function i10Index(citations: number[]): number {
  return citations.filter((c) => c >= 10).length;
}

export interface CitationStats {
  works: number;
  totalCitations: number;
  meanCitations: number;
  medianCitations: number;
  maxCitations: number;
}

export function citationStats(citations: number[]): CitationStats {
  if (citations.length === 0) {
    return { works: 0, totalCitations: 0, meanCitations: 0, medianCitations: 0, maxCitations: 0 };
  }
  const sorted = [...citations].sort((a, b) => a - b);
  const total = sorted.reduce((s, c) => s + c, 0);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : sorted[mid] ?? 0;
  return {
    works: citations.length,
    totalCitations: total,
    meanCitations: total / citations.length,
    medianCitations: median,
    maxCitations: sorted[sorted.length - 1] ?? 0,
  };
}

/** Log-scaled citation distribution buckets (good for skewed citation data). */
export function citationDistribution(citations: number[]): Array<{ bucket: string; count: number }> {
  const buckets = [
    { bucket: "0", test: (c: number) => c === 0 },
    { bucket: "1–9", test: (c: number) => c >= 1 && c <= 9 },
    { bucket: "10–49", test: (c: number) => c >= 10 && c <= 49 },
    { bucket: "50–99", test: (c: number) => c >= 50 && c <= 99 },
    { bucket: "100–499", test: (c: number) => c >= 100 && c <= 499 },
    { bucket: "500+", test: (c: number) => c >= 500 },
  ];
  return buckets.map((b) => ({ bucket: b.bucket, count: citations.filter(b.test).length }));
}
