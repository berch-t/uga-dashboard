import { formatInt } from "@/lib/format";
import type { ContractsMart } from "@/lib/types";

/** Compact table of the most recent / largest research contracts. */
export function ContractsTable({ rows }: { rows: ContractsMart["recent"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
            <th className="py-2 pr-3 font-medium">Acronyme</th>
            <th className="py-2 pr-3 font-medium">Projet</th>
            <th className="py-2 pr-3 font-medium">Financeur</th>
            <th className="py-2 pr-3 font-medium">Année</th>
            <th className="py-2 pr-3 text-right font-medium">Part UGA</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.acronym}-${i}`} className="border-b border-slate-50 dark:border-slate-800/60">
              <td className="py-2 pr-3 font-medium text-brand-600 dark:text-brand-300">{r.acronym || "—"}</td>
              <td className="max-w-[320px] truncate py-2 pr-3 text-slate-700 dark:text-slate-200" title={r.title}>{r.title}</td>
              <td className="py-2 pr-3 text-slate-500 dark:text-slate-400">{r.program}</td>
              <td className="py-2 pr-3 text-slate-500 dark:text-slate-400">{r.year ?? "—"}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                {r.amountEur ? `${formatInt(r.amountEur)} €` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
