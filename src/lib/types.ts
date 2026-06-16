/**
 * UI-facing types. We re-export the pipeline's mart schema so the dashboard and
 * the ETL share one single source of truth — they can never structurally drift.
 */
export type * from "../../pipeline/marts/schema";
