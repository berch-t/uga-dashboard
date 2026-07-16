/**
 * Live source totals for the header.
 *
 * The dashboard's analyses read versioned marts (a documented snapshot), but the
 * two headline counts shown in the header are re-checked live on every view, so
 * they always reflect the current state of OpenAlex and HAL. Each source falls
 * back to the last snapshot value if its API is unreachable — the header never
 * breaks in front of a viewer, it just shows the previous figure.
 *
 * Both lookups are single `meta.count` / `numFound` reads (per-page/rows = 0-1),
 * i.e. cheap, and run concurrently. `cache: "no-store"` makes each render fetch
 * fresh (and opts the route into dynamic rendering).
 */

const OPENALEX_WORKS = "https://api.openalex.org/works";
const HAL_SEARCH = "https://api.archives-ouvertes.fr/search";
const INSTITUTION = process.env.NEXT_PUBLIC_INSTITUTION_OPENALEX_ID ?? "I899635006";
const HAL_ACRONYM = process.env.NEXT_PUBLIC_INSTITUTION_HAL_ACRONYM ?? "UGA";
const MAILTO = process.env.OPENALEX_MAILTO ?? "demo@uga-dashboard.fr";

export interface SourceTotals {
  openAlex: number;
  hal: number;
}

async function fetchOpenAlexTotal(): Promise<number> {
  const params = new URLSearchParams({
    filter: `institutions.id:${INSTITUTION}`,
    "per-page": "1",
    mailto: MAILTO,
  });
  const res = await fetch(`${OPENALEX_WORKS}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
  const data = (await res.json()) as { meta?: { count?: number } };
  if (typeof data.meta?.count !== "number") throw new Error("OpenAlex: missing meta.count");
  return data.meta.count;
}

async function fetchHalTotal(): Promise<number> {
  const params = new URLSearchParams({
    q: "*:*",
    fq: `structAcronym_s:${HAL_ACRONYM}`,
    rows: "0",
    wt: "json",
  });
  const res = await fetch(`${HAL_SEARCH}/?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HAL ${res.status}`);
  const data = (await res.json()) as { response?: { numFound?: number } };
  if (typeof data.response?.numFound !== "number") throw new Error("HAL: missing numFound");
  return data.response.numFound;
}

/**
 * Fetch both totals live, each falling back to its snapshot value on failure.
 */
export async function fetchSourceTotals(fallback: SourceTotals): Promise<SourceTotals> {
  const [openAlex, hal] = await Promise.all([
    fetchOpenAlexTotal().catch(() => fallback.openAlex),
    fetchHalTotal().catch(() => fallback.hal),
  ]);
  return { openAlex, hal };
}
