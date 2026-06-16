import { TrendingUp } from "lucide-react";
import { formatDecimal } from "@/lib/format";
import type { TopicsMart } from "@/lib/types";

/** Ranked list of the strongest recent research-front bursts. */
export function EmergingTopics({ emerging }: { emerging: TopicsMart["emerging"] }) {
  if (emerging.length === 0) {
    return <p className="text-sm text-slate-400">Aucune rafale récente détectée.</p>;
  }
  return (
    <ul className="space-y-2">
      {emerging.map((e, i) => (
        <li key={`${e.name}-${i}`} className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/60 p-3 dark:border-amber-900/40 dark:bg-amber-950/30">
          <span className="mt-0.5 rounded-full bg-amber-100 p-1.5 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
            <TrendingUp className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100" title={e.name}>{e.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rafale {e.startYear}
              {e.endYear !== e.startYear ? `–${e.endYear}` : ""} · intensité {formatDecimal(e.weight, 1)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
