"use client";

import { BarChart } from "@tremor/react";
import { formatInt } from "@/lib/format";
import type { ContractsMart } from "@/lib/types";

/** ANR funding per year (in thousands of euros). */
export function FundingChart({ data }: { data: ContractsMart["byYear"] }) {
  const chartData = data.map((d) => ({
    Année: String(d.year),
    "Financement (k€)": Math.round(d.fundingEur / 1000),
  }));
  return (
    <BarChart
      data={chartData}
      index="Année"
      categories={["Financement (k€)"]}
      colors={["violet"]}
      valueFormatter={(v) => `${formatInt(v)} k€`}
      showLegend={false}
      yAxisWidth={64}
      className="h-60"
    />
  );
}
