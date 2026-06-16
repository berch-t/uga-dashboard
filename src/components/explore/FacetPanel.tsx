"use client";

import { formatInt } from "@/lib/format";
import type { ExploreFacet } from "@/lib/explore";

/** Panneau de facettes : répartition agrégée sur la dimension de la source. */
export function FacetPanel({ facets, field }: { facets: ExploreFacet[]; field: string }) {
  if (facets.length === 0) return null;
  const max = Math.max(...facets.map((f) => f.count), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Facettes · {field}
      </h3>
      <ul className="space-y-2">
        {facets.map((f) => (
          <li key={f.key} className="text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-slate-600 dark:text-slate-300" title={f.label}>
                {f.label}
              </span>
              <span className="tabular-nums text-slate-400">{formatInt(f.count)}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${(f.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
