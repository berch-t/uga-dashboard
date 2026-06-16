"use client";

import { ExternalLink } from "lucide-react";
import type { ExploreRow } from "@/lib/explore";

/** Table des résultats d'une requête (titre, année, métadonnée, lien). */
export function ResultsTable({ rows }: { rows: ExploreRow[] }) {
  if (rows.length === 0) {
    return <p className="p-6 text-center text-sm text-slate-500">Aucun résultat pour cette requête.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
            <th className="py-2 pr-3 font-medium">Titre</th>
            <th className="py-2 pr-3 font-medium">Année</th>
            <th className="py-2 pr-3 font-medium">Détail</th>
            <th className="py-2 pr-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.id}-${i}`} className="border-b border-slate-50 dark:border-slate-800/60">
              <td className="max-w-[420px] truncate py-2 pr-3 text-slate-700 dark:text-slate-200" title={r.title}>
                {r.title}
              </td>
              <td className="py-2 pr-3 tabular-nums text-slate-500 dark:text-slate-400">{r.year ?? "—"}</td>
              <td className="max-w-[220px] truncate py-2 pr-3 text-slate-500 dark:text-slate-400">{r.meta ?? "—"}</td>
              <td className="py-2 pr-3">
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-brand-600 hover:text-brand-700 dark:text-brand-300"
                    aria-label="Ouvrir la source"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
