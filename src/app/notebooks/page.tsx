import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import "katex/dist/katex.min.css";

import { Header } from "@/components/layout/Header";
import { NotebooksExplorer } from "@/components/notebooks/NotebooksExplorer";
import { manifestMart } from "@/lib/marts";
import type { NotebooksManifest } from "@/lib/ipynb";

export const metadata: Metadata = {
  title: "Notebooks — Data Science & Data Engineering | UGA",
  description:
    "Suite de notebooks Python (données réelles HAL/OpenAlex/scanR) : EDA, ingestion d'API, réconciliation, topic modeling, bibliométrie, réseau, séries temporelles.",
};

async function loadManifest(): Promise<NotebooksManifest> {
  const path = join(process.cwd(), "public", "notebooks", "manifest.json");
  try {
    return JSON.parse(await readFile(path, "utf8")) as NotebooksManifest;
  } catch {
    return { generatedAt: "", notebooks: [] };
  }
}

export default async function NotebooksPage() {
  const manifest = await loadManifest();
  const entries = manifest.notebooks.filter((n) => n.status === "ok");

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
          <p className="text-xs font-medium uppercase tracking-widest text-brand-500">
            Data Science &amp; Data Engineering
          </p>
          <h2 className="mt-1 text-2xl font-semibold">Notebooks d&apos;analyse</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
            Suite de notebooks Python reproductibles, exécutés sur des données 100 % réelles
            (HAL, OpenAlex, scanR) et rendus ici tels quels. Chaque notebook couvre une brique du
            métier d&apos;analyste : exploration, ingestion d&apos;API, fiabilisation, modélisation
            thématique, bibliométrie, réseau de collaboration, séries temporelles et pipelines.
            {manifest.generatedAt && (
              <span className="text-slate-400">
                {" "}
                Exécutés le {new Date(manifest.generatedAt).toLocaleDateString("fr-FR")}.
              </span>
            )}
          </p>
        </div>

        {entries.length > 0 ? (
          <NotebooksExplorer entries={entries} />
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
            Aucun notebook exécuté. Lancer <code className="font-mono">uv run python run.py</code> dans{" "}
            <code className="font-mono">notebooks/</code>.
          </p>
        )}
      </main>
    </div>
  );
}
