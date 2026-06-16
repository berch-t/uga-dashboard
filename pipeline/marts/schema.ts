/**
 * Data-mart schemas — the contract between the ETL pipeline and the dashboard.
 *
 * The UI re-exports these types (see `src/lib/types.ts`), so a change here is
 * type-checked on both sides: the marts and the components can never drift.
 */

import type { CanonicalType, OaStatus } from "../connectors/types";
import type { CitationStats } from "../analytics/bibliometrics";
import type { LotkaFit } from "../analytics/lotka";
import type { NetworkData } from "../analytics/network";
import type { ReconciliationReport } from "../transform/reconcile";

export type { CanonicalType, OaStatus } from "../connectors/types";
export type { CitationStats } from "../analytics/bibliometrics";
export type { LotkaFit } from "../analytics/lotka";
export type { NetworkData, NetworkNode, NetworkEdge, NetworkCommunity } from "../analytics/network";
export type { ReconciliationReport } from "../transform/reconcile";

export interface OverviewMart {
  totalWorks: number;
  openAccessShare: number;
  byYear: Array<{ year: number; works: number }>;
  oaByYear: Array<{ year: number; oaWorks: number; total: number; oaShare: number }>;
  typeDistribution: Array<{ type: CanonicalType; label: string; count: number }>;
  oaDistribution: Array<{ status: OaStatus; label: string; count: number }>;
}

export interface SourcesMart {
  topSources: Array<{ name: string; count: number }>;
}

export interface BibliometricsMart {
  hIndex: number;
  gIndex: number;
  i10Index: number;
  stats: CitationStats;
  distribution: Array<{ bucket: string; count: number }>;
  indicesBasis: string;
  distributionBasis: string;
}

export interface TopicSeries {
  id: string;
  name: string;
  field: string | null;
  total: number;
  series: number[];
  cagr: number;
  slope: number;
  bursts: Array<{ startYear: number; endYear: number; weight: number }>;
}
export interface TopicsMart {
  years: number[];
  topics: TopicSeries[];
  emerging: Array<{ name: string; field: string | null; startYear: number; endYear: number; weight: number }>;
}

export interface AuthorsMart {
  topAuthors: Array<{ name: string; works: number }>;
  lotka: LotkaFit;
}

export interface PaperRecord {
  id: string;
  title: string;
  year: number | null;
  type: CanonicalType;
  typeLabel: string;
  citations: number;
  oaStatus: OaStatus | null;
  doi: string | null;
  venue: string | null;
  authors: string[];
  topic: string | null;
  field: string | null;
  abstract: string | null;
}
export interface PapersMart {
  works: PaperRecord[];
}

export type NetworkMart = NetworkData;

/** Coverage of an ingested internal file against OpenAlex (DOI lookup). */
export interface InternalSourceSummary {
  fileName: string;
  records: number;
  recordsWithDoi: number;
  matchedToOpenAlex: number;
  coverage: number;
}
export type ReconciliationMart = ReconciliationReport & { internalSource?: InternalSourceSummary };

/** Research contracts / funding (ANR open data), the "valorisation" scope. */
export interface ContractsMart {
  source: string;
  period: { fromYear: number; toYear: number };
  totalProjects: number;
  fundedProjects: number;
  totalFundingEur: number;
  meanFundingEur: number;
  byYear: Array<{ year: number; projects: number; fundingEur: number }>;
  topPrograms: Array<{ name: string; count: number }>;
  recent: Array<{
    acronym: string;
    title: string;
    year: number | null;
    amountEur: number | null;
    program: string;
    coordinator: string;
  }>;
}

export interface Manifest {
  institution: { name: string; openAlexId: string; halStructAcronym: string };
  generatedAt: string;
  sources: {
    openAlex: { total: number; endpoint: string };
    hal: { total: number; endpoint: string };
  };
  corpus: {
    fullWorks: number;
    sampleWorks: number;
    sampleWindow: string;
    topCited: number;
  };
  marts: string[];
}
