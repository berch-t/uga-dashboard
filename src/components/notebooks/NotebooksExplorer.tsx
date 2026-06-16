"use client";

import { useEffect, useState } from "react";
import { Download, FileDown, Loader2 } from "lucide-react";
import type { Notebook, NotebookEntry } from "@/lib/ipynb";
import { NotebookSidebar } from "./NotebookSidebar";
import { NotebookViewer } from "./NotebookViewer";

/** Explorateur de notebooks : sidebar + visualiseur + exports (look Colab). */
export function NotebooksExplorer({ entries }: { entries: NotebookEntry[] }) {
  const [activeId, setActiveId] = useState(entries[0]?.id ?? "");
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);

  const active = entries.find((e) => e.id === activeId);

  // Lien profond : ?nb=ID permet d'ouvrir (et de partager) un notebook précis.
  // Lu après le montage pour éviter toute divergence d'hydratation.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("nb");
    if (param && entries.some((e) => e.id === param)) setActiveId(param);
  }, [entries]);

  const select = (id: string) => {
    setActiveId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("nb", id);
    window.history.replaceState({}, "", url);
  };

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/notebooks/${activeId}.ipynb`)
      .then((r) => r.json())
      .then((nb: Notebook) => {
        if (!cancelled) setNotebook(nb);
      })
      .catch(() => {
        if (!cancelled) setNotebook(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr] print:block">
      <aside className="h-fit rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-4 print:hidden">
        <NotebookSidebar entries={entries} activeId={activeId} onSelect={select} />
      </aside>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 print:rounded-none print:border-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 print:border-0 print:px-0">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{active?.title}</h3>
          <div className="flex items-center gap-2 print:hidden">
            <a
              href={`/notebooks/${activeId}.ipynb`}
              download
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" /> .ipynb
            </a>
            <a
              href={`/notebooks/${activeId}.pdf`}
              download
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FileDown className="h-3.5 w-3.5" /> PDF
            </a>
          </div>
        </header>

        {loading || !notebook ? (
          <div className="flex h-64 items-center justify-center text-slate-400">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Notebook indisponible"}
          </div>
        ) : (
          <NotebookViewer notebook={notebook} />
        )}
      </section>
    </div>
  );
}
