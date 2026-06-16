"use client";

import { BarList, DonutChart, Legend } from "@tremor/react";
import { formatInt, formatPercent } from "@/lib/format";
import { OA_COLORS } from "@/lib/colors";
import type { OverviewMart } from "@/lib/types";

/** Document-type breakdown (harmonised taxonomy) as a ranked bar list. */
export function TypeBreakdown({ data }: { data: OverviewMart["typeDistribution"] }) {
  const items = data.map((d) => ({ name: d.label, value: d.count }));
  return <BarList data={items} valueFormatter={formatInt} color="blue" className="mt-2" />;
}

/** Open Access composition by colour (diamond/gold/hybrid/green/bronze/closed). */
export function OpenAccessDonut({ data }: { data: OverviewMart["oaDistribution"] }) {
  const chartData = data.map((d) => ({ name: d.label, value: d.count }));
  const colors = data.map((d) => OA_COLORS[d.status].tremor);
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="flex flex-col items-center gap-3">
      <DonutChart
        data={chartData}
        category="value"
        index="name"
        colors={colors}
        valueFormatter={(v) => `${formatInt(v)} (${formatPercent(v / total, 0)})`}
        className="h-52"
      />
      <Legend categories={data.map((d) => d.label)} colors={colors} className="max-w-full justify-center" />
    </div>
  );
}
