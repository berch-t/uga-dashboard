import { describe, expect, it } from "vitest";
import { detectBursts } from "../pipeline/analytics/burst";
import { fitLotka } from "../pipeline/analytics/lotka";
import { jaccard, reconcile } from "../pipeline/transform/reconcile";
import type { CanonicalWork } from "../pipeline/connectors/types";

describe("Kleinberg burst detection", () => {
  it("flags the elevated window in a spiked series", () => {
    const totals = Array(8).fill(100);
    const counts = [1, 1, 1, 1, 30, 30, 1, 1];
    const res = detectBursts(counts, totals);
    expect(res.intervals.length).toBeGreaterThanOrEqual(1);
    const burst = res.intervals[0]!;
    expect(burst.startIndex).toBeLessThanOrEqual(4);
    expect(burst.endIndex).toBeGreaterThanOrEqual(5);
  });
  it("finds no burst in a flat series", () => {
    const res = detectBursts([5, 5, 5, 5], [100, 100, 100, 100]);
    expect(res.intervals.length).toBe(0);
  });
});

describe("Lotka's law fit", () => {
  it("recovers an exponent near 2 on synthetic 1/n^2 data", () => {
    // Build authors: count n appears ~ 1000/n^2 times.
    const perAuthor: number[] = [];
    for (let n = 1; n <= 10; n++) {
      const authors = Math.round(1000 / n ** 2);
      for (let i = 0; i < authors; i++) perAuthor.push(n);
    }
    const fit = fitLotka(perAuthor);
    expect(fit.exponent).toBeGreaterThan(1.6);
    expect(fit.exponent).toBeLessThan(2.4);
    expect(fit.r2).toBeGreaterThan(0.9);
  });
});

describe("jaccard", () => {
  it("computes set similarity", () => {
    expect(jaccard(new Set(["a", "b"]), new Set(["a", "b"]))).toBe(1);
    expect(jaccard(new Set(["a", "b"]), new Set(["a", "c"]))).toBeCloseTo(1 / 3, 5);
  });
});

describe("reconciliation", () => {
  const work = (over: Partial<CanonicalWork>): CanonicalWork => ({
    id: "x", source: "openalex", doi: null, title: "t", year: 2020, type: "Article",
    citations: 0, oaStatus: null, authors: [], institutions: [], topic: null, venue: null, abstract: null,
    ...over,
  });
  it("matches on DOI and reports method", () => {
    const oa = [work({ id: "oa1", doi: "10.1/x", source: "openalex" })];
    const hal = [work({ id: "hal1", doi: "10.1/x", source: "hal" })];
    const report = reconcile(oa, hal, { fromYear: 2020, toYear: 2020 });
    expect(report.counts.matched).toBe(1);
    expect(report.matchMethod.doi).toBe(1);
  });
  it("matches DOI-less records by fuzzy title", () => {
    const oa = [work({ id: "oa1", title: "Deep learning for climate models", year: 2021 })];
    const hal = [work({ id: "hal1", source: "hal", title: "Deep learning for climate models", year: 2021 })];
    const report = reconcile(oa, hal, { fromYear: 2021, toYear: 2021 });
    expect(report.counts.matched).toBe(1);
    expect(report.matchMethod.fuzzyTitle).toBe(1);
  });
});
