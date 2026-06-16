/**
 * Central configuration for the ingestion pipeline.
 *
 * Every tunable lives here so the whole dashboard can be retargeted at another
 * institution, time window or sampling budget by editing a single file.
 */

const CURRENT_YEAR = new Date().getUTCFullYear();

export const config = {
  institution: {
    /** OpenAlex institution id for Université Grenoble Alpes. */
    openAlexId: process.env.NEXT_PUBLIC_INSTITUTION_OPENALEX_ID ?? "I899635006",
    /** HAL structure acronym used to scope the HAL corpus. */
    halStructAcronym: process.env.HAL_STRUCT_ACRONYM ?? "UGA",
    name: process.env.NEXT_PUBLIC_INSTITUTION_NAME ?? "Université Grenoble Alpes",
  },

  openAlex: {
    baseUrl: "https://api.openalex.org",
    /** Contact mail -> "polite pool" (faster, more reliable). */
    mailto: process.env.OPENALEX_MAILTO ?? "demo@uga-dashboard.fr",
    perPage: 200,
  },

  hal: {
    baseUrl: "https://api.archives-ouvertes.fr/search",
    rows: 1000,
  },

  /** Year span for all time-series aggregations (full-corpus, year-sliced). */
  timeSeries: {
    fromYear: 2010,
    toYear: CURRENT_YEAR,
  },

  /**
   * Analytical sample: a bounded, *defined* corpus used for the analyses that
   * require per-work records (collaboration network, Lotka, abstracts). Headline
   * KPIs never use the sample — they use full-corpus aggregates.
   */
  sample: {
    fromYear: 2022,
    toYear: 2024,
    maxWorks: 6000,
  },

  /** Top-cited works pulled to compute institution-level h/g/i10 indices. */
  bibliometrics: {
    topCitedCount: 1000,
  },

  /** Collaboration network shaping. */
  network: {
    /** Keep the strongest nodes for legibility (by collaboration weight). */
    maxNodes: 120,
    /** Drop edges below this co-occurrence weight. */
    minEdgeWeight: 2,
  },

  /** Reconciliation sample window (must overlap with `sample` for fairness). */
  reconciliation: {
    fromYear: 2022,
    toYear: 2024,
    maxPerSource: 6000,
  },

  /**
   * Internal files: structured exports treated as a third source. The UGA's
   * real management-tool exports are confidential, so these REAL public files
   * (HAL export, ANR open data) stand in. Regenerate with `npm run internal`.
   */
  internal: {
    publicationsCsv: "data/internal/publications.csv",
    contractsCsv: "data/internal/contracts.csv",
  },

  /** Politeness: delay between paged requests (ms). */
  requestDelayMs: 120,

  outDir: "data/marts",
} as const;

export type AppConfig = typeof config;
