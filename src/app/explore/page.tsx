import type { Metadata } from "next";

import { Header } from "@/components/layout/Header";
import { ExploreConsole } from "@/components/explore/ExploreConsole";
import { manifestMart } from "@/lib/marts";

export const metadata: Metadata = {
  title: "Navigateur d'API — UGA",
  description:
    "Requêtage interactif et multi-sources (OpenAlex, HAL, scanR) : construire une requête, explorer les résultats et les facettes, exporter en CSV.",
};

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        institution={manifestMart.institution.name}
        generatedAt={manifestMart.generatedAt}
        openAlexTotal={manifestMart.sources.openAlex.total}
        halTotal={manifestMart.sources.hal.total}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-brand-500">Navigation & requêtage d&apos;API</p>
          <h2 className="mt-1 text-2xl font-semibold">Navigateur d&apos;API</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
            Interrogez en direct les trois sources ouvertes (OpenAlex, HAL, scanR) via une requête ciblée :
            choisissez la source, composez les filtres, explorez les résultats et leurs facettes, et exportez
            en CSV. La requête réellement envoyée à l&apos;API est affichée pour la transparence.
          </p>
        </div>
        <ExploreConsole />
      </main>
    </div>
  );
}
