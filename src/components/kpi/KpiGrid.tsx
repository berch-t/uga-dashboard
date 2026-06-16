import { Card } from "@tremor/react";
import type { KpiDefinition } from "./registry";

/** Renders the KPI registry as a responsive grid of metric cards. */
export function KpiGrid({ kpis }: { kpis: KpiDefinition[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <Card key={kpi.id} className="animate-fade-in-up !p-4" decoration="top" decorationColor="blue">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{kpi.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">{kpi.value}</p>
          <p className="mt-2 text-xs leading-snug text-slate-400 dark:text-slate-500">{kpi.help}</p>
        </Card>
      ))}
    </div>
  );
}
