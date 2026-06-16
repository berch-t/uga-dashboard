/**
 * Moteur de requêtage multi-sources pour le navigateur d'API (côté serveur).
 *
 * Chaque source (OpenAlex, HAL, scanR) est interrogée en direct et normalisée
 * vers un même format `ExploreResult`. Ajouter une source = ajouter une fonction
 * ici, exactement comme l'interface `Connector` du pipeline.
 */

const OPENALEX = "https://api.openalex.org/works";
const HAL = "https://api.archives-ouvertes.fr/search";
const SCANR =
  "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/" +
  "export-des-financements-exposes-dans-scanr/records";

const INSTITUTION = process.env.NEXT_PUBLIC_INSTITUTION_OPENALEX_ID ?? "I899635006";
const HAL_ACRONYM = process.env.NEXT_PUBLIC_INSTITUTION_HAL_ACRONYM ?? "UGA";
const MAILTO = process.env.OPENALEX_MAILTO ?? "demo@uga-dashboard.fr";

export type ExploreSource = "openalex" | "hal" | "scanr";

export interface ExploreParams {
  source: ExploreSource;
  q?: string;
  fromYear?: number;
  toYear?: number;
  type?: string;
  oa?: boolean;
}

export interface ExploreFacet {
  key: string;
  label: string;
  count: number;
}

export interface ExploreRow {
  id: string;
  title: string;
  year?: number;
  meta?: string;
  url?: string;
}

export interface ExploreResult {
  source: ExploreSource;
  count: number;
  rows: ExploreRow[];
  facets: ExploreFacet[];
  facetField: string;
  queryUrl: string;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/** Première valeur d'un champ HAL (parfois renvoyé comme tableau). */
function halField(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? "");
  return value == null ? "" : String(value);
}

export async function runExplore(p: ExploreParams): Promise<ExploreResult> {
  if (p.source === "hal") return exploreHal(p);
  if (p.source === "scanr") return exploreScanr(p);
  return exploreOpenAlex(p);
}

async function exploreOpenAlex(p: ExploreParams): Promise<ExploreResult> {
  const filters = [`institutions.id:${INSTITUTION}`];
  if (p.fromYear) filters.push(`from_publication_date:${p.fromYear}-01-01`);
  if (p.toYear) filters.push(`to_publication_date:${p.toYear}-12-31`);
  if (typeof p.oa === "boolean") filters.push(`open_access.is_oa:${p.oa}`);
  if (p.type) filters.push(`type:${p.type}`);

  const base = new URLSearchParams({ filter: filters.join(","), mailto: MAILTO });
  if (p.q) base.set("search", p.q);
  const listUrl = `${OPENALEX}?${base}&per-page=25&select=id,doi,title,publication_year,cited_by_count,open_access`;
  const facetUrl = `${OPENALEX}?${base}&group_by=type&per-page=200`;

  type Work = {
    id: string;
    doi: string | null;
    title: string | null;
    publication_year: number | null;
    cited_by_count: number;
    open_access?: { oa_status?: string };
  };
  type Resp = { meta: { count: number }; results: Work[] };
  type FacetResp = { group_by: Array<{ key: string; key_display_name: string; count: number }> };

  const [list, facets] = await Promise.all([getJson<Resp>(listUrl), getJson<FacetResp>(facetUrl)]);

  return {
    source: "openalex",
    count: list.meta.count,
    rows: list.results.map((w) => ({
      id: w.id,
      title: w.title ?? "(sans titre)",
      year: w.publication_year ?? undefined,
      meta: `${w.cited_by_count} citations · ${w.open_access?.oa_status ?? "n/a"}`,
      url: w.doi ?? w.id,
    })),
    facets: (facets.group_by ?? []).slice(0, 12).map((g) => ({ key: g.key, label: g.key_display_name, count: g.count })),
    facetField: "type",
    queryUrl: listUrl,
  };
}

async function exploreHal(p: ExploreParams): Promise<ExploreResult> {
  const fq = [`structAcronym_s:${HAL_ACRONYM}`];
  if (p.fromYear || p.toYear) fq.push(`publicationDateY_i:[${p.fromYear ?? "*"} TO ${p.toYear ?? "*"}]`);
  const params = new URLSearchParams({
    q: p.q || "*:*",
    rows: "25",
    fl: "halId_s,title_s,docType_s,publicationDateY_i,doiId_s",
    sort: "publicationDateY_i desc",
    wt: "json",
    facet: "true",
    "facet.field": "docType_s",
    "facet.limit": "12",
  });
  fq.forEach((f) => params.append("fq", f));
  const url = `${HAL}?${params}`;

  type Resp = {
    response: { numFound: number; docs: Array<Record<string, unknown>> };
    facet_counts: { facet_fields: { docType_s: Array<string | number> } };
  };
  const data = await getJson<Resp>(url);
  const raw = data.facet_counts.facet_fields.docType_s;

  return {
    source: "hal",
    count: data.response.numFound,
    rows: data.response.docs.map((d) => ({
      id: halField(d.halId_s),
      title: halField(d.title_s) || "(sans titre)",
      year: Number(d.publicationDateY_i) || undefined,
      meta: halField(d.docType_s),
      url: d.doiId_s ? `https://doi.org/${halField(d.doiId_s)}` : `https://hal.science/${halField(d.halId_s)}`,
    })),
    facets: Array.from({ length: Math.floor(raw.length / 2) }, (_, i) => ({
      key: String(raw[i * 2]),
      label: String(raw[i * 2]),
      count: Number(raw[i * 2 + 1]),
    })),
    facetField: "docType_s",
    queryUrl: url,
  };
}

async function exploreScanr(p: ExploreParams): Promise<ExploreResult> {
  // Le champ `year` de scanR est de type texte : les comparaisons numériques y
  // sont invalides. On filtre donc sur le partenaire et la recherche plein texte,
  // et l'on s'appuie sur le tri par année décroissante pour la fraîcheur.
  const where = ['search(participants, "Grenoble Alpes")'];
  if (p.q) where.push(`search(label, "${p.q.replace(/"/g, "")}")`);
  const params = new URLSearchParams({ where: where.join(" and "), limit: "25", order_by: "year desc" });
  const url = `${SCANR}?${params}`;
  const facetUrl = `${SCANR}?${new URLSearchParams({ where: where.join(" and "), group_by: "type", limit: "20" })}`;

  type Rec = { id?: string; type?: string; year?: string; acronym?: string; label?: string };
  type Resp = { total_count: number; results: Rec[] };
  type FacetResp = { results: Array<{ type: string; count?: number }> };

  const [data, facets] = await Promise.all([getJson<Resp>(url), getJson<FacetResp>(facetUrl).catch(() => ({ results: [] }))]);
  const pick = (raw?: string): string => {
    if (!raw) return "";
    try {
      const o = JSON.parse(raw) as Record<string, string>;
      return o.fr ?? o.default ?? o.en ?? Object.values(o)[0] ?? "";
    } catch {
      return raw;
    }
  };

  return {
    source: "scanr",
    count: data.total_count,
    rows: data.results.map((r) => ({
      id: r.id ?? "",
      title: pick(r.label) || pick(r.acronym) || "(sans titre)",
      year: Number(r.year) || undefined,
      meta: `${r.type ?? ""} · ${pick(r.acronym)}`,
    })),
    facets: facets.results.map((g) => ({ key: g.type, label: g.type, count: g.count ?? 0 })),
    facetField: "type",
    queryUrl: url,
  };
}
