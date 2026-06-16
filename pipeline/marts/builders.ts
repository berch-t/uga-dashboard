/**
 * Pure mart builders: raw API data in, typed marts out. No I/O, no fetching —
 * which keeps them trivial to unit-test and to reason about.
 */

import type { AggBucket, CanonicalWork, OaStatus } from "../connectors/types";
import { CANONICAL_TYPE_LABELS, CANONICAL_TYPES, openAlexTypeToCanonical } from "../transform/taxonomy";
import { citationDistribution, citationStats, gIndex, hIndex } from "../analytics/bibliometrics";
import { fitLotka } from "../analytics/lotka";
import { detectBursts } from "../analytics/burst";
import { cagr, linearRegression } from "../analytics/trends";
import { buildCollaborationNetwork } from "../analytics/network";
import { reconcile } from "../transform/reconcile";
import type {
  AuthorsMart, BibliometricsMart, NetworkMart, OverviewMart,
  PapersMart, ReconciliationMart, SourcesMart, TopicsMart,
} from "./schema";

const OA_LABELS: Record<OaStatus, string> = {
  diamond: "Diamant", gold: "Or (gold)", hybrid: "Hybride",
  green: "Vert (green)", bronze: "Bronze", closed: "Accès fermé",
};
const OA_ORDER: OaStatus[] = ["diamond", "gold", "hybrid", "green", "bronze", "closed"];

export function buildOverview(input: {
  totalWorks: number;
  byYear: AggBucket[];
  typeAgg: AggBucket[];
  oaStatusAgg: AggBucket[];
  oaByYear: Array<{ year: number; oaWorks: number; total: number }>;
  yearRange: { fromYear: number; toYear: number };
}): OverviewMart {
  const byYear = input.byYear
    .map((b) => ({ year: Number(b.key), works: b.count }))
    .filter((d) => d.year >= input.yearRange.fromYear && d.year <= input.yearRange.toYear)
    .sort((a, b) => a.year - b.year);

  // Canonicalise OpenAlex types and sum by canonical bucket.
  const typeMap = new Map<string, number>();
  for (const b of input.typeAgg) {
    const c = openAlexTypeToCanonical(b.key);
    typeMap.set(c, (typeMap.get(c) ?? 0) + b.count);
  }
  const typeDistribution = CANONICAL_TYPES.map((type) => ({
    type, label: CANONICAL_TYPE_LABELS[type], count: typeMap.get(type) ?? 0,
  })).filter((d) => d.count > 0).sort((a, b) => b.count - a.count);

  const oaCount = new Map<string, number>(input.oaStatusAgg.map((b) => [b.key, b.count]));
  const oaDistribution = OA_ORDER
    .map((status) => ({ status, label: OA_LABELS[status], count: oaCount.get(status) ?? 0 }))
    .filter((d) => d.count > 0);

  const totalOa = input.oaStatusAgg.filter((b) => b.key !== "closed").reduce((s, b) => s + b.count, 0);

  return {
    totalWorks: input.totalWorks,
    openAccessShare: input.totalWorks ? totalOa / input.totalWorks : 0,
    byYear,
    oaByYear: input.oaByYear
      .map((d) => ({ ...d, oaShare: d.total ? d.oaWorks / d.total : 0 }))
      .sort((a, b) => a.year - b.year),
    typeDistribution,
    oaDistribution,
  };
}

export function buildSources(sourceAgg: AggBucket[], limit = 15): SourcesMart {
  return {
    topSources: sourceAgg
      .filter((b) => b.label && b.label !== "unknown")
      .slice(0, limit)
      .map((b) => ({ name: b.label, count: b.count })),
  };
}

export function buildBibliometrics(
  topCited: CanonicalWork[],
  sample: CanonicalWork[],
  i10Full: number,
): BibliometricsMart {
  const topCitations = topCited.map((w) => w.citations);
  const sampleCitations = sample.map((w) => w.citations);
  return {
    hIndex: hIndex(topCitations),
    gIndex: gIndex(topCitations),
    // i10 = nombre de publications à >= 10 citations sur le corpus complet
    // (mesuré côté API ; le calculer sur le top-cité le plafonnerait à sa taille).
    i10Index: i10Full,
    stats: citationStats(sampleCitations),
    distribution: citationDistribution(sampleCitations),
    indicesBasis: `${topCited.length} publications les plus citées (OpenAlex)`,
    distributionBasis: `échantillon ${sample.length} publications récentes`,
  };
}

export function buildTopics(input: {
  years: number[];
  globalTopics: AggBucket[];
  perYear: Map<number, AggBucket[]>;
  totalsByYear: Map<number, number>;
  topN?: number;
}): TopicsMart {
  const { years } = input;
  const totals = years.map((y) => input.totalsByYear.get(y) ?? 0);
  const top = input.globalTopics.slice(0, input.topN ?? 40);

  const topics = top.map((t) => {
    const series = years.map((y) => input.perYear.get(y)?.find((b) => b.key === t.key)?.count ?? 0);
    const burst = detectBursts(series, totals);
    const nonZero = series.findIndex((v) => v > 0);
    const growth = nonZero >= 0 ? cagr(series[nonZero] || 1, series[series.length - 1] ?? 0, series.length - 1 - nonZero) : 0;
    const fit = linearRegression(series.map((y, i) => ({ x: i, y })));
    return {
      id: t.key,
      name: t.label,
      field: null,
      total: t.count,
      series,
      cagr: growth,
      slope: fit.slope,
      bursts: burst.intervals.map((iv) => ({
        startYear: years[iv.startIndex] ?? years[0]!,
        endYear: years[iv.endIndex] ?? years[years.length - 1]!,
        weight: Math.round(iv.weight * 10) / 10,
      })),
    };
  });

  const recentCutoff = (years[years.length - 1] ?? 0) - 2;
  const emerging = topics
    .flatMap((t) => t.bursts.filter((b) => b.endYear >= recentCutoff).map((b) => ({ name: t.name, field: t.field, ...b })))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);

  return { years, topics, emerging };
}

export function buildAuthors(topAuthorsAgg: AggBucket[], sample: CanonicalWork[], limit = 15): AuthorsMart {
  const perAuthor = new Map<string, number>();
  for (const w of sample) {
    for (const a of w.authors) {
      const key = a.id ?? a.name;
      perAuthor.set(key, (perAuthor.get(key) ?? 0) + 1);
    }
  }
  return {
    topAuthors: topAuthorsAgg.slice(0, limit).map((b) => ({ name: b.label, works: b.count })),
    lotka: fitLotka([...perAuthor.values()]),
  };
}

export function buildNetwork(sample: CanonicalWork[]): NetworkMart {
  return buildCollaborationNetwork(sample);
}

export function buildReconciliation(
  oaSample: CanonicalWork[], halSample: CanonicalWork[], window: { fromYear: number; toYear: number },
): ReconciliationMart {
  return reconcile(oaSample, halSample, window);
}

export function buildPapers(topCited: CanonicalWork[], limit = 200): PapersMart {
  return {
    works: topCited.slice(0, limit).map((w) => ({
      id: w.id,
      title: w.title,
      year: w.year,
      type: w.type,
      typeLabel: CANONICAL_TYPE_LABELS[w.type],
      citations: w.citations,
      oaStatus: w.oaStatus,
      doi: w.doi,
      venue: w.venue,
      authors: w.authors.slice(0, 12).map((a) => a.name),
      topic: w.topic?.name ?? null,
      field: w.topic?.field ?? null,
      abstract: w.abstract,
    })),
  };
}
