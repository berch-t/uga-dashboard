/**
 * HAL × OpenAlex record linkage.
 *
 * Two-stage matching, following the classic record-linkage framework
 * (Fellegi & Sunter 1969; Christen 2012):
 *   1. Deterministic match on normalised DOI (exact).
 *   2. Probabilistic fallback for DOI-less records: blocking on
 *      (year, title prefix) to cut the comparison space, then Jaccard
 *      similarity on title token sets above a threshold.
 *
 * Output is a linkage report quantifying coverage and the type-taxonomy gap —
 * exactly the "qualifier et fiabiliser les données" activity in the job spec.
 */

import { normalizeTitle, tokenSet } from "./normalize";
import { CANONICAL_TYPE_LABELS, CANONICAL_TYPES } from "./taxonomy";
import type { CanonicalType, CanonicalWork } from "../connectors/types";

/** Jaccard index of two token sets — |A∩B| / |A∪B|. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

const FUZZY_THRESHOLD = 0.6;
const blockKey = (year: number | null, normTitle: string) =>
  `${year ?? "?"}|${normTitle.slice(0, 4)}`;

export interface ReconciliationReport {
  window: { fromYear: number; toYear: number };
  counts: {
    openAlexSample: number;
    halSample: number;
    matched: number;
    openAlexOnly: number;
    halOnly: number;
    union: number;
  };
  matchMethod: { doi: number; fuzzyTitle: number };
  rates: { coverageByHal: number; coverageByOpenAlex: number; jaccardOfSets: number };
  typeComparison: Array<{ type: CanonicalType; label: string; openAlex: number; hal: number }>;
  examples: {
    matched: Array<{ title: string; doi: string | null; year: number | null }>;
    openAlexOnly: Array<{ title: string; year: number | null }>;
    halOnly: Array<{ title: string; year: number | null }>;
  };
}

export function reconcile(
  openAlex: CanonicalWork[],
  hal: CanonicalWork[],
  window: { fromYear: number; toYear: number },
): ReconciliationReport {
  // Index OpenAlex by DOI and by blocking key for the fuzzy stage.
  const oaByDoi = new Map<string, CanonicalWork>();
  const oaByBlock = new Map<string, Array<{ work: CanonicalWork; tokens: Set<string> }>>();
  for (const w of openAlex) {
    if (w.doi) oaByDoi.set(w.doi, w);
    const norm = normalizeTitle(w.title);
    const key = blockKey(w.year, norm);
    const bucket = oaByBlock.get(key) ?? [];
    bucket.push({ work: w, tokens: tokenSet(norm) });
    oaByBlock.set(key, bucket);
  }

  const matchedOa = new Set<string>();
  let doiMatches = 0;
  let fuzzyMatches = 0;
  const matchedExamples: ReconciliationReport["examples"]["matched"] = [];

  for (const h of hal) {
    let hit: CanonicalWork | undefined;

    if (h.doi && oaByDoi.has(h.doi)) {
      hit = oaByDoi.get(h.doi);
      if (hit && !matchedOa.has(hit.id)) doiMatches++;
    } else {
      const norm = normalizeTitle(h.title);
      const candidates = oaByBlock.get(blockKey(h.year, norm)) ?? [];
      const hTokens = tokenSet(norm);
      let best = 0;
      for (const c of candidates) {
        const s = jaccard(hTokens, c.tokens);
        if (s > best) { best = s; hit = c.work; }
      }
      if (hit && best >= FUZZY_THRESHOLD && !matchedOa.has(hit.id)) fuzzyMatches++;
      else hit = undefined;
    }

    if (hit && !matchedOa.has(hit.id)) {
      matchedOa.add(hit.id);
      if (matchedExamples.length < 8) {
        matchedExamples.push({ title: hit.title, doi: hit.doi, year: hit.year });
      }
    }
  }

  const matched = matchedOa.size;
  const openAlexOnly = openAlex.length - matched;
  const halOnly = hal.length - matched;
  const union = matched + openAlexOnly + halOnly;

  // Harmonised type comparison across the canonical taxonomy.
  const countByType = (works: CanonicalWork[]) => {
    const m = new Map<CanonicalType, number>();
    for (const w of works) m.set(w.type, (m.get(w.type) ?? 0) + 1);
    return m;
  };
  const oaTypes = countByType(openAlex);
  const halTypes = countByType(hal);
  const typeComparison = CANONICAL_TYPES.map((type) => ({
    type,
    label: CANONICAL_TYPE_LABELS[type],
    openAlex: oaTypes.get(type) ?? 0,
    hal: halTypes.get(type) ?? 0,
  })).filter((r) => r.openAlex + r.hal > 0);

  return {
    window,
    counts: { openAlexSample: openAlex.length, halSample: hal.length, matched, openAlexOnly, halOnly, union },
    matchMethod: { doi: doiMatches, fuzzyTitle: fuzzyMatches },
    rates: {
      coverageByHal: hal.length ? matched / hal.length : 0,
      coverageByOpenAlex: openAlex.length ? matched / openAlex.length : 0,
      jaccardOfSets: union ? matched / union : 0,
    },
    typeComparison,
    examples: {
      matched: matchedExamples,
      openAlexOnly: openAlex.filter((w) => !matchedOa.has(w.id)).slice(0, 6).map((w) => ({ title: w.title, year: w.year })),
      halOnly: hal.slice(0, 6).map((w) => ({ title: w.title, year: w.year })),
    },
  };
}
