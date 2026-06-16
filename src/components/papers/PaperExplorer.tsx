"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import type { PaperRecord } from "@/lib/types";
import { PaperRow } from "./PaperRow";
import { PaperModal } from "./PaperModal";
import {
  DEFAULT_FILTERS, OA_OPTIONS, SORT_OPTIONS, TYPE_OPTIONS, YEAR_OPTIONS,
  toQueryString, type PaperFilters,
} from "./filters";

/**
 * Live, filterable paper explorer. Seeds with the most-cited works (mart) for
 * an instant first paint, then queries `/api/papers` (live OpenAlex) whenever
 * the user changes a filter — so the corpus is browsable in full, not mocked.
 */
export function PaperExplorer({ seed }: { seed: PaperRecord[] }) {
  const [filters, setFilters] = useState<PaperFilters>(DEFAULT_FILTERS);
  const [papers, setPapers] = useState<PaperRecord[]>(seed);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [selected, setSelected] = useState<PaperRecord | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/papers?${toQueryString(filters)}`, { signal: controller.signal });
        const data = (await res.json()) as { works: PaperRecord[] };
        setPapers(data.works ?? []);
        setLive(true);
      } catch (err) {
        if (!(err instanceof DOMException)) setPapers([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [filters]);

  const update = (patch: Partial<PaperFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher dans les titres et résumés…"
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>
        <FilterSelect label="De" value={filters.from} onChange={(v) => update({ from: v })} options={YEAR_OPTIONS} />
        <FilterSelect label="À" value={filters.to} onChange={(v) => update({ to: v })} options={YEAR_OPTIONS} />
        <FilterSelect label="Type" value={filters.type} onChange={(v) => update({ type: v })} options={TYPE_OPTIONS} />
        <FilterSelect label="Accès" value={filters.oa} onChange={(v) => update({ oa: v })} options={OA_OPTIONS} />
        <FilterSelect label="Tri" value={filters.sort} onChange={(v) => update({ sort: v as PaperFilters["sort"] })} options={SORT_OPTIONS} />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          {live ? "Données en direct via OpenAlex" : "Publications les plus citées de l'établissement"} ·{" "}
          {papers.length} résultats
        </span>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-brand-500" /> : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {papers.map((paper) => (
          <PaperRow key={paper.id} paper={paper} onSelect={() => setSelected(paper)} />
        ))}
      </div>
      {!loading && papers.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Aucune publication ne correspond à ces critères.</p>
      ) : null}

      {selected ? <PaperModal paper={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string } | string>;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
      >
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </select>
    </label>
  );
}
