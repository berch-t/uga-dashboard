/** Option sets and query helpers for the paper explorer. */

export interface PaperFilters {
  from: string;
  to: string;
  type: string;
  oa: string;
  q: string;
  sort: "citations" | "date";
}

export const DEFAULT_FILTERS: PaperFilters = {
  from: "2020",
  to: "2026",
  type: "",
  oa: "",
  q: "",
  sort: "citations",
};

export const TYPE_OPTIONS = [
  { value: "", label: "Tous les types" },
  { value: "Article", label: "Article" },
  { value: "Preprint", label: "Preprint" },
  { value: "BookChapter", label: "Chapitre d'ouvrage" },
  { value: "Book", label: "Ouvrage" },
  { value: "Thesis", label: "Thèse / HDR" },
  { value: "Dataset", label: "Jeu de données" },
  { value: "Report", label: "Rapport" },
];

export const OA_OPTIONS = [
  { value: "", label: "Tous les accès" },
  { value: "true", label: "Accès ouvert" },
  { value: "false", label: "Accès fermé" },
];

export const SORT_OPTIONS = [
  { value: "citations", label: "Plus citées" },
  { value: "date", label: "Plus récentes" },
];

export const YEAR_OPTIONS = Array.from({ length: 2026 - 2000 + 1 }, (_, i) => String(2000 + i)).reverse();

/** Serialise filters into the /api/papers query string. */
export function toQueryString(f: PaperFilters): string {
  const p = new URLSearchParams();
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.type) p.set("type", f.type);
  if (f.oa) p.set("oa", f.oa);
  if (f.q) p.set("q", f.q);
  p.set("sort", f.sort);
  p.set("limit", "30");
  return p.toString();
}
