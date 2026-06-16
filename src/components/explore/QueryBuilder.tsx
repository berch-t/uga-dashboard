"use client";

import { Search } from "lucide-react";
import type { ExploreSource } from "@/lib/explore";

export interface QueryState {
  source: ExploreSource;
  q: string;
  fromYear: string;
  toYear: string;
  type: string;
  oa: string;
}

const SOURCES: Array<{ value: ExploreSource; label: string }> = [
  { value: "openalex", label: "OpenAlex" },
  { value: "hal", label: "HAL" },
  { value: "scanr", label: "scanR (financements)" },
];

const inputCls =
  "rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

/** Constructeur de requête : source, recherche, filtres. */
export function QueryBuilder({
  state,
  onChange,
  onRun,
  loading,
}: {
  state: QueryState;
  onChange: (next: QueryState) => void;
  onRun: () => void;
  loading: boolean;
}) {
  const set = (patch: Partial<QueryState>) => onChange({ ...state, ...patch });
  const isOpenAlex = state.source === "openalex";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onRun();
      }}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <Field label="Source">
        <select className={inputCls} value={state.source} onChange={(e) => set({ source: e.target.value as ExploreSource })}>
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Recherche" grow>
        <input
          className={`${inputCls} w-full`}
          placeholder="mots-clés (titre, résumé…)"
          value={state.q}
          onChange={(e) => set({ q: e.target.value })}
        />
      </Field>

      <Field label="Année min">
        <input className={`${inputCls} w-24`} inputMode="numeric" placeholder="2019" value={state.fromYear} onChange={(e) => set({ fromYear: e.target.value })} />
      </Field>
      <Field label="Année max">
        <input className={`${inputCls} w-24`} inputMode="numeric" placeholder="2024" value={state.toYear} onChange={(e) => set({ toYear: e.target.value })} />
      </Field>

      {isOpenAlex && (
        <>
          <Field label="Type">
            <input className={`${inputCls} w-28`} placeholder="article…" value={state.type} onChange={(e) => set({ type: e.target.value })} />
          </Field>
          <Field label="Accès ouvert">
            <select className={inputCls} value={state.oa} onChange={(e) => set({ oa: e.target.value })}>
              <option value="">indifférent</option>
              <option value="true">ouvert</option>
              <option value="false">fermé</option>
            </select>
          </Field>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        <Search className="h-4 w-4" />
        {loading ? "Requête…" : "Exécuter"}
      </button>
    </form>
  );
}

function Field({ label, children, grow }: { label: string; children: React.ReactNode; grow?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${grow ? "min-w-[12rem] flex-1" : ""}`}>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}
