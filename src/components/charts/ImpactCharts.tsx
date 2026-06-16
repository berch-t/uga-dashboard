"use client";

import { BarChart } from "@tremor/react";
import { formatInt } from "@/lib/format";
import type { BibliometricsMart, LotkaFit } from "@/lib/types";

/** Citation distribution across log-scaled buckets. */
export function CitationDistribution({ data }: { data: BibliometricsMart["distribution"] }) {
  const chartData = data.map((d) => ({ Citations: d.bucket, Publications: d.count }));
  return (
    <BarChart
      data={chartData}
      index="Citations"
      categories={["Publications"]}
      colors={["blue"]}
      valueFormatter={formatInt}
      showLegend={false}
      yAxisWidth={52}
      className="h-60"
    />
  );
}

/**
 * Lotka's law: observed authors-per-productivity vs the fitted 1/n^a model.
 * The close overlay is the visual proof that the corpus follows the law.
 */
export function LotkaChart({ lotka, maxPapers = 8 }: { lotka: LotkaFit; maxPapers?: number }) {
  const chartData = lotka.spectrum
    .filter((s) => s.papers <= maxPapers)
    .map((s) => ({
      "Publications / auteur": String(s.papers),
      Observé: s.authors,
      "Loi de Lotka": s.predicted,
    }));
  return (
    <BarChart
      data={chartData}
      index="Publications / auteur"
      categories={["Observé", "Loi de Lotka"]}
      colors={["blue", "amber"]}
      valueFormatter={formatInt}
      yAxisWidth={56}
      className="h-60"
    />
  );
}
