"use client";

import { useState } from "react";
import { Download, Link2 } from "lucide-react";
import { formatInt } from "@/lib/format";
import type { ExploreResult } from "@/lib/explore";
import { QueryBuilder, type QueryState } from "./QueryBuilder";
import { ResultsTable } from "./ResultsTable";
import { FacetPanel } from "./FacetPanel";

const INITIAL: QueryState = { source: "openalex", q: "", fromYear: "2019", toYear: "2024", type: "", oa: "" };

/** Console interactive : construit la requête, l'exécute, affiche et exporte. */
export function ExploreConsole() {
  const [state, setState] = useState<QueryState>(INITIAL);
  const [result, setResult] = useState<ExploreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ source: state.source });
    if (state.q) params.set("q", state.q);
    if (state.fromYear) params.set("from", state.fromYear);
    if (state.toYear) params.set("to", state.toYear);
    if (state.source === "openalex" && state.type) params.set("type", state.type);
    if (state.source === "openalex" && state.oa) params.set("oa", state.oa);
    try {
      const res = await fetch(`/api/explore?${params}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setResult((await res.json()) as ExploreResult);
    } catch (e) {
      setError(String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!result) return;
    const header = "titre;annee;detail;url";
    const lines = result.rows.map((r) =>
      [r.title, r.year ?? "", r.meta ?? "", r.url ?? ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"),
    );
    const blob = new Blob([`${header}\n${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `explore-${result.source}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-4">
      <QueryBuilder state={state} onChange={setState} onRun={run} loading={loading} />

      {error && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}

      {result && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-300">
              <strong className="tabular-nums">{formatInt(result.count)}</strong> résultats · {result.rows.length} affichés
            </span>
            <div className="flex items-center gap-2">
              <a
                href={result.queryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Link2 className="h-3.5 w-3.5" /> Requête brute
              </a>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <ResultsTable rows={result.rows} />
            </div>
            <FacetPanel facets={result.facets} field={result.facetField} />
          </div>
        </>
      )}
    </div>
  );
}
