/**
 * Live OpenAlex client used by the drill-down API route.
 *
 * The dashboard reads pre-computed marts for everything corpus-wide; this
 * client powers the *interactive* paper explorer, querying OpenAlex in real
 * time so users can drill into any slice (year, type, Open Access, free text)
 * beyond the seeded set. Reuses the pipeline's pure transforms (DRY).
 */

import { normalizeDoi, reconstructAbstract } from "../../pipeline/transform/normalize";
import { CANONICAL_TYPE_LABELS, openAlexTypeToCanonical } from "../../pipeline/transform/taxonomy";
import type { PaperRecord } from "./types";

const BASE = "https://api.openalex.org/works";
const INSTITUTION = process.env.NEXT_PUBLIC_INSTITUTION_OPENALEX_ID ?? "I899635006";
const MAILTO = process.env.OPENALEX_MAILTO ?? "demo@uga-dashboard.fr";

/** Canonical type -> OpenAlex `type` values (one canonical maps to several). */
const CANONICAL_TO_OPENALEX: Record<string, string[]> = {
  Article: ["article", "review", "letter"],
  Preprint: ["preprint"],
  BookChapter: ["book-chapter"],
  Book: ["book", "monograph"],
  Thesis: ["dissertation"],
  Report: ["report"],
  Dataset: ["dataset"],
  Other: ["other", "paratext", "peer-review"],
};

export interface PaperQuery {
  fromYear?: number;
  toYear?: number;
  type?: string; // canonical type
  openAccess?: boolean;
  search?: string;
  sort?: "citations" | "date";
  perPage?: number;
}

interface OAWork {
  id: string;
  doi: string | null;
  title: string | null;
  publication_year: number | null;
  cited_by_count: number;
  type: string | null;
  open_access?: { oa_status?: string };
  authorships?: Array<{ author?: { display_name?: string } }>;
  primary_topic?: { display_name?: string; field?: { display_name?: string } } | null;
  primary_location?: { source?: { display_name?: string } | null } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
}

export async function fetchLivePapers(query: PaperQuery): Promise<PaperRecord[]> {
  const filters = [`institutions.id:${INSTITUTION}`];
  if (query.fromYear) filters.push(`from_publication_date:${query.fromYear}-01-01`);
  if (query.toYear) filters.push(`to_publication_date:${query.toYear}-12-31`);
  if (typeof query.openAccess === "boolean") filters.push(`open_access.is_oa:${query.openAccess}`);
  const oaTypes = query.type ? CANONICAL_TO_OPENALEX[query.type] : undefined;
  if (oaTypes && oaTypes.length) filters.push(`type:${oaTypes.join("|")}`);

  const params = new URLSearchParams({
    filter: filters.join(","),
    "per-page": String(Math.min(query.perPage ?? 25, 50)),
    sort: query.sort === "date" ? "publication_date:desc" : "cited_by_count:desc",
    select:
      "id,doi,title,publication_year,cited_by_count,type,open_access,authorships,primary_topic,primary_location,abstract_inverted_index",
    mailto: MAILTO,
  });
  if (query.search) params.set("search", query.search);

  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 }, // cache identical queries for an hour
  });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
  const data = (await res.json()) as { results: OAWork[] };

  return data.results.map((w): PaperRecord => {
    const type = openAlexTypeToCanonical(w.type);
    return {
      id: w.id,
      title: w.title ?? "Sans titre",
      year: w.publication_year,
      type,
      typeLabel: CANONICAL_TYPE_LABELS[type],
      citations: w.cited_by_count ?? 0,
      oaStatus: (w.open_access?.oa_status as PaperRecord["oaStatus"]) ?? null,
      doi: normalizeDoi(w.doi),
      venue: w.primary_location?.source?.display_name ?? null,
      authors: (w.authorships ?? []).map((a) => a.author?.display_name ?? "—").slice(0, 12),
      topic: w.primary_topic?.display_name ?? null,
      field: w.primary_topic?.field?.display_name ?? null,
      abstract: reconstructAbstract(w.abstract_inverted_index),
    };
  });
}
