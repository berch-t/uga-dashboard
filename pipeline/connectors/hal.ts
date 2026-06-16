/**
 * HAL connector (CCSD open archive).
 *
 * HAL exposes a Solr-style API: `numFound` + faceting + `cursorMark` deep
 * paging. We use facets for distributions and a DOI-bearing sample to feed the
 * HAL × OpenAlex reconciliation engine.
 */

import { config } from "../config";
import { fetchJson, politeDelay, qs } from "./http";
import { halDocTypeToCanonical } from "../transform/taxonomy";
import { normalizeDoi } from "../transform/normalize";
import type { AggBucket, CanonicalWork, Connector } from "./types";

interface HalResponse {
  response: { numFound: number; docs: HalDoc[] };
  nextCursorMark?: string;
  facet_counts?: { facet_fields: Record<string, Array<string | number>> };
}

interface HalDoc {
  halId_s?: string;
  doiId_s?: string;
  title_s?: string[];
  docType_s?: string;
  publicationDateY_i?: number;
  authFullName_s?: string[];
  journalTitle_s?: string;
}

const SCOPE = () => `structAcronym_s:${config.institution.halStructAcronym}`;

function mapDoc(d: HalDoc): CanonicalWork {
  return {
    id: d.halId_s ?? `hal:${d.doiId_s ?? Math.random()}`,
    source: "hal",
    doi: normalizeDoi(d.doiId_s),
    title: d.title_s?.[0] ?? "Sans titre",
    year: d.publicationDateY_i ?? null,
    type: halDocTypeToCanonical(d.docType_s),
    citations: 0, // HAL does not expose citation counts.
    oaStatus: null,
    authors: (d.authFullName_s ?? []).map((name) => ({ id: null, name })),
    institutions: [],
    topic: null,
    venue: d.journalTitle_s ?? null,
    abstract: null,
  };
}

export class HalConnector implements Connector {
  readonly id = "hal" as const;

  private url(params: Record<string, string | number | undefined>): string {
    return `${config.hal.baseUrl}/?${qs({ q: "*:*", wt: "json", ...params })}`;
  }

  async fetchTotal(): Promise<number> {
    const res = await fetchJson<HalResponse>(this.url({ fq: SCOPE(), rows: 0 }));
    return res.response.numFound;
  }

  /** Generic facet aggregation (e.g. `docType_s`, `publicationDateY_i`, `domain_s`). */
  async facet(field: string, limit = 30): Promise<AggBucket[]> {
    const res = await fetchJson<HalResponse>(
      this.url({ fq: SCOPE(), rows: 0, facet: "true", "facet.field": field, "facet.limit": limit }),
    );
    const flat = res.facet_counts?.facet_fields?.[field] ?? [];
    const out: AggBucket[] = [];
    for (let i = 0; i < flat.length; i += 2) {
      const key = String(flat[i]);
      const count = Number(flat[i + 1]);
      out.push({ key, label: key, count });
    }
    return out;
  }

  async fetchTypeFacets(): Promise<AggBucket[]> {
    return this.facet("docType_s");
  }

  /** Sample with DOIs for record linkage, deep-paged with `cursorMark`. */
  async fetchSample(opts: { fromYear: number; toYear: number; maxWorks: number; requireDoi?: boolean }): Promise<CanonicalWork[]> {
    const fq = [
      SCOPE(),
      `publicationDateY_i:[${opts.fromYear} TO ${opts.toYear}]`,
      opts.requireDoi ? "doiId_s:*" : undefined,
    ].filter(Boolean) as string[];

    const out: CanonicalWork[] = [];
    let cursor = "*";
    while (out.length < opts.maxWorks) {
      const params: Record<string, string | number> = {
        rows: config.hal.rows,
        sort: "docid asc", // a total order is required for cursorMark
        cursorMark: cursor,
        fl: "halId_s,doiId_s,title_s,docType_s,publicationDateY_i,authFullName_s,journalTitle_s",
      };
      // Multiple fq params share the same key; append manually.
      const url = this.url(params) + fq.map((f) => `&fq=${encodeURIComponent(f)}`).join("");
      const res = await fetchJson<HalResponse>(url);
      for (const d of res.response.docs) out.push(mapDoc(d));
      if (!res.nextCursorMark || res.nextCursorMark === cursor || res.response.docs.length === 0) break;
      cursor = res.nextCursorMark;
      await politeDelay();
    }
    return out.slice(0, opts.maxWorks);
  }
}
