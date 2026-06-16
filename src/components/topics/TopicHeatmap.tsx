import { formatInt } from "@/lib/format";
import type { TopicsMart } from "@/lib/types";

/**
 * Topic × year heatmap. Cells are row-normalised (each topic against its own
 * peak) to reveal trajectories; years detected as a burst (Kleinberg) are
 * ringed in amber — the "when did this front accelerate" signal.
 */
export function TopicHeatmap({ mart, topN = 14, lastYears = 12 }: { mart: TopicsMart; topN?: number; lastYears?: number }) {
  const years = mart.years.slice(-lastYears);
  const yearIndex = (y: number) => mart.years.indexOf(y);
  const topics = mart.topics.slice(0, topN);

  const burstYears = (topic: TopicsMart["topics"][number]) => {
    const set = new Set<number>();
    for (const b of topic.bursts) for (let y = b.startYear; y <= b.endYear; y++) set.add(y);
    return set;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: "2px" }}>
        <thead>
          <tr>
            <th className="sticky left-0 bg-white dark:bg-slate-900" />
            {years.map((y) => (
              <th key={y} className="px-1 text-[10px] font-medium text-slate-400">{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {topics.map((topic) => {
            const cells = years.map((y) => topic.series[yearIndex(y)] ?? 0);
            const rowMax = Math.max(1, ...cells);
            const bursts = burstYears(topic);
            return (
              <tr key={topic.id}>
                <td className="sticky left-0 max-w-[220px] truncate bg-white pr-2 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300" title={topic.name}>
                  {topic.name}
                </td>
                {years.map((y, i) => {
                  const count = cells[i] ?? 0;
                  const intensity = count === 0 ? 0.04 : 0.15 + 0.85 * (count / rowMax);
                  const isBurst = bursts.has(y);
                  return (
                    <td key={y} className="p-0">
                      <div
                        title={`${topic.name} — ${y} : ${formatInt(count)} publications${isBurst ? " (rafale détectée)" : ""}`}
                        className="h-7 w-full rounded-sm"
                        style={{
                          backgroundColor: `rgba(31, 95, 168, ${intensity})`,
                          boxShadow: isBurst ? "inset 0 0 0 2px #f59e0b" : undefined,
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-400">
        Intensité = volume annuel normalisé par topic. Contour ambré = année en rafale (détection de Kleinberg, 2002).
      </p>
    </div>
  );
}
