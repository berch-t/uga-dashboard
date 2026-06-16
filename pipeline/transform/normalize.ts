/**
 * Normalisation helpers used by connectors (ingestion) and the reconciliation
 * engine. Pure functions, fully unit-tested.
 */

/**
 * Canonical DOI form: lowercase, no scheme/host prefix, trimmed.
 * Returns null for empty/invalid input so callers can branch cleanly.
 */
export function normalizeDoi(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let doi = raw.trim().toLowerCase();
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
  doi = doi.replace(/^doi:/, "");
  return doi.length > 0 ? doi : null;
}

/**
 * Normalised title for fuzzy matching: HTML stripped, lowercased,
 * diacritics removed, punctuation collapsed to single spaces.
 */
export function normalizeTitle(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]+>/g, " ") // strip HTML tags (OpenAlex titles can contain them)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Tokenise a normalised string into a unique set of word tokens. */
export function tokenSet(normalized: string): Set<string> {
  return new Set(normalized.split(" ").filter((t) => t.length > 1));
}

/**
 * Reconstruct readable abstract text from OpenAlex's `abstract_inverted_index`
 * (a word -> [positions] map). Returns null when absent.
 */
export function reconstructAbstract(
  index: Record<string, number[]> | null | undefined,
): string | null {
  if (!index) return null;
  const positions: Array<[number, string]> = [];
  for (const [word, locs] of Object.entries(index)) {
    for (const loc of locs) positions.push([loc, word]);
  }
  if (positions.length === 0) return null;
  positions.sort((a, b) => a[0] - b[0]);
  return positions.map(([, word]) => word).join(" ");
}
