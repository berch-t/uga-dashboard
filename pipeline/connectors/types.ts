/**
 * Domain model shared across connectors and analytics.
 *
 * Each source (OpenAlex, HAL, …) maps its native payload onto `CanonicalWork`
 * so that every downstream stage (reconciliation, analytics, marts) is fully
 * source-agnostic. Adding a source means implementing `Connector` only.
 */

export type CanonicalType =
  | "Article"
  | "Preprint"
  | "ConferencePaper"
  | "BookChapter"
  | "Book"
  | "Thesis"
  | "Report"
  | "Dataset"
  | "Other";

export type OaStatus =
  | "diamond"
  | "gold"
  | "green"
  | "hybrid"
  | "bronze"
  | "closed";

export interface CanonicalAuthor {
  id: string | null;
  name: string;
}

export interface CanonicalInstitution {
  id: string;
  name: string;
  country: string | null;
}

export interface CanonicalWork {
  id: string;
  source: "openalex" | "hal" | "file";
  doi: string | null;
  title: string;
  year: number | null;
  type: CanonicalType;
  citations: number;
  oaStatus: OaStatus | null;
  authors: CanonicalAuthor[];
  institutions: CanonicalInstitution[];
  topic: { id: string; name: string; field: string | null } | null;
  venue: string | null;
  abstract: string | null;
}

/** A single bucket of a `group_by`-style aggregation. */
export interface AggBucket {
  key: string;
  label: string;
  count: number;
}

/**
 * Source-agnostic ingestion contract.
 *
 * `fetchTypeFacets` and `fetchTotal` power the reconciliation and headline
 * figures; `fetchSample` returns per-work records for the heavy analyses.
 */
export interface Connector {
  readonly id: "openalex" | "hal" | "file";
  fetchTotal(): Promise<number>;
  fetchTypeFacets(): Promise<AggBucket[]>;
  fetchSample(opts: {
    fromYear: number;
    toYear: number;
    maxWorks: number;
    requireDoi?: boolean;
  }): Promise<CanonicalWork[]>;
}
