"use client";

import { AreaChart, LineChart } from "@tremor/react";
import { formatInt, formatPercent } from "@/lib/format";
import type { OverviewMart } from "@/lib/types";

/** Annual publication volume (full corpus). */
export function ProductionTrend({ data }: { data: OverviewMart["byYear"] }) {
  const chartData = data.map((d) => ({ Année: String(d.year), Publications: d.works }));
  return (
    <AreaChart
      data={chartData}
      index="Année"
      categories={["Publications"]}
      colors={["blue"]}
      valueFormatter={formatInt}
      showLegend={false}
      yAxisWidth={52}
      className="h-64"
      curveType="monotone"
    />
  );
}

/** Open Access share over time (%). */
export function OpenAccessTrend({ data }: { data: OverviewMart["oaByYear"] }) {
  const chartData = data.map((d) => ({
    Année: String(d.year),
    "Taux d'accès ouvert": Math.round(d.oaShare * 1000) / 10,
  }));
  return (
    <LineChart
      data={chartData}
      index="Année"
      categories={["Taux d'accès ouvert"]}
      colors={["emerald"]}
      valueFormatter={(v) => formatPercent(v / 100)}
      showLegend={false}
      yAxisWidth={52}
      className="h-64"
      curveType="monotone"
    />
  );
}
