/**
 * Declarative KPI registry.
 *
 * Adding a headline indicator = adding one entry here. The grid renders whatever
 * this function returns, so no component code changes when the board evolves.
 */

import { formatInt, formatPercent } from "@/lib/format";
import type { AuthorsMart, BibliometricsMart, NetworkMart, OverviewMart } from "@/lib/types";

export interface KpiDefinition {
  id: string;
  label: string;
  value: string;
  help: string;
}

export interface KpiInputs {
  overview: OverviewMart;
  bibliometrics: BibliometricsMart;
  network: NetworkMart;
  authors: AuthorsMart;
}

export function buildKpis({ overview, bibliometrics, network, authors }: KpiInputs): KpiDefinition[] {
  return [
    {
      id: "works",
      label: "Publications",
      value: formatInt(overview.totalWorks),
      help: "Corpus OpenAlex complet de l'établissement.",
    },
    {
      id: "open-access",
      label: "Accès ouvert",
      value: formatPercent(overview.openAccessShare),
      help: "Part des publications en accès ouvert (toutes voies confondues).",
    },
    {
      id: "h-index",
      label: "h-index",
      value: formatInt(bibliometrics.hIndex),
      help: bibliometrics.indicesBasis + " — indice de Hirsch (2005).",
    },
    {
      id: "top-citation",
      label: "Article le plus cité",
      value: `${formatInt(bibliometrics.stats.maxCitations)} cit.`,
      help: "Citations de la publication la plus citée de l'établissement.",
    },
    {
      id: "authors",
      label: "Auteurs distincts",
      value: formatInt(authors.lotka.totalAuthors),
      help: "Auteurs distincts sur l'échantillon récent (loi de Lotka).",
    },
    {
      id: "communities",
      label: "Communautés de collaboration",
      value: formatInt(network.communities.length),
      help: "Regroupements d'institutions détectés par l'algorithme de Louvain.",
    },
  ];
}
