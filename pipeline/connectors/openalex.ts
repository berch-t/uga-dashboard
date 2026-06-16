/**
 * OpenAlex connector.
 *
 * Strategy:
 *  - Headline figures & time series come from `group_by` aggregations over the
 *    FULL corpus (cheap, exhaustive) — optionally sliced per year.
 *  - Per-work analyses (network, Lotka, abstracts) use a bounded, documented
 *    sample fetched with cursor pagination.
 */

import { config } from "../config";
import { fetchJson, politeDelay, qs } from "./http";
import { openAlexTypeToCanonical } from "../transform/taxonomy";
import { normalizeDoi, reconstructAbstract } from "../transform/normalize";
import type { AggBucket, CanonicalWork, Connector, OaStatus } from "./types";

interface OAGroup { key: string; key_display_name: string; count: number }
interface OAResponse<T> { meta: { count: number; next_cursor: string | null }; results: T[]; group_by?: OAGroup[] }

interface OAWork {
  id: string;
  doi: string | null;
  title: string | null;
  publication_year: number | null;
  cited_by_count: number;
  type: string | null;
  open_access?: { oa_status?: string };
  authorships?: Array<{
    author?: { id?: string; display_name?: string };
    institutions?: Array<{ id?: string; display_name?: string; country_code?: string }>;
  }>;
  primary_topic?: { id?: string; display_name?: string; field?: { display_name?: string } } | null;
  primary_location?: { source?: { display_name?: string } | null } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
}

const INSTITUTION_FILTER = () => `institutions.id:${config.institution.openAlexId}`;

function authString(): string {
  return qs({ mailto: config.openAlex.mailto });
}

function mapWork(w: OAWork): CanonicalWork {
  const institutions = new Map<string, { id: string; name: string; country: string | null }>();
  const authors: CanonicalWork["authors"] = [];
  for (const a of w.authorships ?? []) {
    if (a.author?.display_name) authors.push({ id: a.author.id ?? null, name: a.author.display_name });
    for (const inst of a.institutions ?? []) {
      if (inst.id && inst.display_name && !institutions.has(inst.id)) {
        institutions.set(inst.id, { id: inst.id, name: inst.display_name, country: inst.country_code ?? null });
      }
    }
  }
  const topic = w.primary_topic?.id
    ? { id: w.primary_topic.id, name: w.primary_topic.display_name ?? "—", field: w.primary_topic.field?.display_name ?? null }
    : null;
  return {
    id: w.id,
    source: "openalex",
    doi: normalizeDoi(w.doi),
    title: w.title ?? "Sans titre",
    year: w.publication_year,
    type: openAlexTypeToCanonical(w.type),
    citations: w.cited_by_count ?? 0,
    oaStatus: (w.open_access?.oa_status as OaStatus | undefined) ?? null,
    authors,
    institutions: [...institutions.values()],
    topic,
    venue: w.primary_location?.source?.display_name ?? null,
    abstract: reconstructAbstract(w.abstract_inverted_index),
  };
}

export class OpenAlexConnector implements Connector {
  readonly id = "openalex" as const;

  private url(path: string, params: Record<string, string | number | undefined>): string {
    return `${config.openAlex.baseUrl}${path}?${qs(params)}&${authString()}`;
  }

  async fetchTotal(): Promise<number> {
    const res = await fetchJson<OAResponse<unknown>>(
      this.url("/works", { filter: INSTITUTION_FILTER(), "per-page": 1 }),
    );
    return res.meta.count;
  }

  /**
   * Full-corpus count of works with at least `min` citations (reads `meta.count`).
   * Powers the i10-index, which must be measured on the whole corpus — computing
   * it on the top-cited slice alone would cap it at the slice size.
   */
  async fetchCountWithMinCitations(min: number): Promise<number> {
    const res = await fetchJson<OAResponse<unknown>>(
      this.url("/works", { filter: `${INSTITUTION_FILTER()},cited_by_count:>${min - 1}`, "per-page": 1 }),
    );
    return res.meta.count;
  }

  /**
   * Generic full-corpus aggregation. OpenAlex caps the returned `group_by`
   * array to the `per-page` value, so we request the maximum (200 buckets).
   */
  async groupBy(dimension: string, extraFilter?: string): Promise<AggBucket[]> {
    const filter = extraFilter ? `${INSTITUTION_FILTER()},${extraFilter}` : INSTITUTION_FILTER();
    const res = await fetchJson<OAResponse<unknown>>(
      this.url("/works", { filter, group_by: dimension, "per-page": 200 }),
    );
    return (res.group_by ?? []).map((g) => ({ key: g.key, label: g.key_display_name, count: g.count }));
  }

  /** Same aggregation, restricted to a single publication year. */
  async groupByForYear(dimension: string, year: number): Promise<AggBucket[]> {
    return this.groupBy(dimension, `publication_year:${year}`);
  }

  async fetchTypeFacets(): Promise<AggBucket[]> {
    return this.groupBy("type");
  }

  /** Bounded sample via cursor pagination (no abstracts, to stay light). */
  async fetchSample(opts: { fromYear: number; toYear: number; maxWorks: number }): Promise<CanonicalWork[]> {
    const select =
      "id,doi,title,publication_year,cited_by_count,type,open_access,authorships,primary_topic,primary_location";
    const filter = `${INSTITUTION_FILTER()},from_publication_date:${opts.fromYear}-01-01,to_publication_date:${opts.toYear}-12-31`;
    return this.cursorCollect(filter, select, opts.maxWorks, "publication_year");
  }

  /**
   * Return the subset of `dois` that exist in OpenAlex, checked in batches via
   * the `doi:a|b|…` OR-filter. Powers the internal-file coverage metric without
   * one request per record.
   */
  async findExistingDois(dois: string[]): Promise<Set<string>> {
    const found = new Set<string>();
    const batchSize = 50;
    for (let i = 0; i < dois.length; i += batchSize) {
      const batch = dois.slice(i, i + batchSize);
      const url = `${config.openAlex.baseUrl}/works?filter=doi:${batch.join("|")}&select=doi&per-page=${batchSize}&${authString()}`;
      try {
        const res = await fetchJson<OAResponse<OAWork>>(url);
        for (const w of res.results) {
          const n = normalizeDoi(w.doi);
          if (n) found.add(n);
        }
      } catch {
        // A malformed DOI in a batch should not abort the whole lookup.
      }
      await politeDelay();
    }
    return found;
  }

  /** Top-cited works (with abstracts) for bibliometrics + the paper explorer seed. */
  async fetchTopCited(count: number): Promise<CanonicalWork[]> {
    const select =
      "id,doi,title,publication_year,cited_by_count,type,open_access,authorships,primary_topic,primary_location,abstract_inverted_index";
    return this.cursorCollect(INSTITUTION_FILTER(), select, count, "cited_by_count:desc");
  }

  private async cursorCollect(filter: string, select: string, max: number, sort: string): Promise<CanonicalWork[]> {
    const out: CanonicalWork[] = [];
    let cursor = "*";
    while (out.length < max && cursor) {
      const res = await fetchJson<OAResponse<OAWork>>(
        this.url("/works", { filter, select, sort, "per-page": config.openAlex.perPage, cursor }),
      );
      for (const w of res.results) out.push(mapWork(w));
      cursor = res.meta.next_cursor ?? "";
      if (res.results.length === 0) break;
      await politeDelay();
    }
    return out.slice(0, max);
  }
}
