/**
 * Document-type harmonisation.
 *
 * HAL and OpenAlex use different taxonomies. To compare and reconcile them we
 * project both onto a single canonical taxonomy. This table is the *single
 * source of truth* for type harmonisation — extend it here, nowhere else.
 */

import type { CanonicalType } from "../connectors/types";

/** OpenAlex `type` (https://api.openalex.org/works?group_by=type). */
const OPENALEX_TO_CANONICAL: Record<string, CanonicalType> = {
  article: "Article",
  review: "Article",
  preprint: "Preprint",
  "book-chapter": "BookChapter",
  book: "Book",
  monograph: "Book",
  dissertation: "Thesis",
  dataset: "Dataset",
  report: "Report",
  "peer-review": "Other",
  paratext: "Other",
  other: "Other",
  libguides: "Other",
  editorial: "Other",
  erratum: "Other",
  letter: "Article",
};

/** HAL `docType_s` (https://api.archives-ouvertes.fr). */
const HAL_TO_CANONICAL: Record<string, CanonicalType> = {
  ART: "Article",
  COMM: "ConferencePaper",
  POSTER: "ConferencePaper",
  COUV: "BookChapter",
  OUV: "Book",
  DOUV: "Book",
  THESE: "Thesis",
  HDR: "Thesis",
  MEM: "Report",
  REPORT: "Report",
  UNDEFINED: "Other",
  OTHER: "Other",
  PREPRINT: "Preprint",
  IMG: "Other",
  VIDEO: "Other",
  SON: "Other",
  MAP: "Other",
  PATENT: "Other",
};

export function openAlexTypeToCanonical(type: string | null | undefined): CanonicalType {
  if (!type) return "Other";
  // `group_by=type` returns IRIs (e.g. "https://openalex.org/types/article"),
  // whereas `select=type` returns the bare slug. Accept both.
  const slug = type.includes("/") ? type.slice(type.lastIndexOf("/") + 1) : type;
  return OPENALEX_TO_CANONICAL[slug] ?? "Other";
}

export function halDocTypeToCanonical(docType: string | null | undefined): CanonicalType {
  if (!docType) return "Other";
  return HAL_TO_CANONICAL[docType.toUpperCase()] ?? "Other";
}

/** French labels for the canonical taxonomy (UI + reports). */
export const CANONICAL_TYPE_LABELS: Record<CanonicalType, string> = {
  Article: "Article",
  Preprint: "Preprint",
  ConferencePaper: "Communication",
  BookChapter: "Chapitre d'ouvrage",
  Book: "Ouvrage",
  Thesis: "Thèse / HDR",
  Report: "Rapport / Mémoire",
  Dataset: "Jeu de données",
  Other: "Autre",
};

export const CANONICAL_TYPES = Object.keys(CANONICAL_TYPE_LABELS) as CanonicalType[];
