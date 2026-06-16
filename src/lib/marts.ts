/**
 * Typed access to the data marts produced by `npm run pipeline`.
 *
 * The JSON is imported (and therefore bundled) at build time, so the dashboard
 * renders instantly and deploys as a static-friendly app — no database, no
 * runtime API dependency for the corpus-wide views.
 */

import overview from "../../data/marts/overview.json";
import sources from "../../data/marts/sources.json";
import bibliometrics from "../../data/marts/bibliometrics.json";
import topics from "../../data/marts/topics.json";
import authors from "../../data/marts/authors.json";
import network from "../../data/marts/network.json";
import reconciliation from "../../data/marts/reconciliation.json";
import papers from "../../data/marts/papers.json";
import contracts from "../../data/marts/contracts.json";
import manifest from "../../data/marts/manifest.json";

import type {
  AuthorsMart, BibliometricsMart, ContractsMart, Manifest, NetworkMart,
  OverviewMart, PapersMart, ReconciliationMart, SourcesMart, TopicsMart,
} from "./types";

export const overviewMart = overview as unknown as OverviewMart;
export const sourcesMart = sources as unknown as SourcesMart;
export const bibliometricsMart = bibliometrics as unknown as BibliometricsMart;
export const topicsMart = topics as unknown as TopicsMart;
export const authorsMart = authors as unknown as AuthorsMart;
export const networkMart = network as unknown as NetworkMart;
export const reconciliationMart = reconciliation as unknown as ReconciliationMart;
export const papersMart = papers as unknown as PapersMart;
export const contractsMart = contracts as unknown as ContractsMart;
export const manifestMart = manifest as unknown as Manifest;
