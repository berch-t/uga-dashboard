"use client";

import { BarChart } from "@tremor/react";
import { formatInt, formatPercent } from "@/lib/format";
import type { ReconciliationMart } from "@/lib/types";

/**
 * HAL × OpenAlex record-linkage report. This is the "qualifier, fiabiliser,
 * réconcilier" activity from the job spec, made visible: how much the two open
 * sources overlap, how matches were obtained, and how their type taxonomies
 * differ once harmonised.
 */
export function ReconciliationPanel({ data }: { data: ReconciliationMart }) {
  const { counts, matchMethod, rates } = data;
  const total = counts.union || 1;
  const seg = [
    { label: "OpenAlex seul", value: counts.openAlexOnly, color: "bg-blue-500" },
    { label: "Apparié (HAL ∩ OpenAlex)", value: counts.matched, color: "bg-emerald-500" },
    { label: "HAL seul", value: counts.halOnly, color: "bg-amber-500" },
  ];

  const typeData = data.typeComparison.map((t) => ({ Type: t.label, OpenAlex: t.openAlex, HAL: t.hal }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Appariements" value={formatInt(counts.matched)} hint={`fenêtre ${data.window.fromYear}–${data.window.toYear}`} />
        <Stat label="Via DOI" value={formatInt(matchMethod.doi)} hint="appariement déterministe" />
        <Stat label="Via titre (flou)" value={formatInt(matchMethod.fuzzyTitle)} hint="Jaccard ≥ 0,6" />
        <Stat label="Indice de recouvrement" value={formatPercent(rates.jaccardOfSets, 1)} hint="Jaccard des ensembles" />
      </div>

      <div>
        <div className="flex h-7 w-full overflow-hidden rounded-md">
          {seg.map((s) => (
            <div key={s.label} className={s.color} style={{ width: `${(s.value / total) * 100}%` }} title={`${s.label} : ${formatInt(s.value)}`} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          {seg.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${s.color}`} />
              {s.label} · {formatInt(s.value)}
            </span>
          ))}
        </div>
      </div>

      {data.internalSource ? (
        <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-3 dark:border-violet-900/40 dark:bg-violet-950/30">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            3ᵉ source : fichier interne ingéré (<span className="font-mono text-xs">{data.internalSource.fileName}</span>)
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {formatInt(data.internalSource.records)} notices, dont {formatInt(data.internalSource.recordsWithDoi)} avec DOI ·{" "}
            <span className="font-semibold text-violet-700 dark:text-violet-300">
              {formatPercent(data.internalSource.coverage, 1)}
            </span>{" "}
            retrouvées dans OpenAlex ({formatInt(data.internalSource.matchedToOpenAlex)}). Contrôle de cohérence d&apos;un
            export de gestion contre la base ouverte de référence.
          </p>
        </div>
      ) : null}

      <div>
        <h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          Écart de taxonomie : types de documents harmonisés (OpenAlex vs HAL)
        </h4>
        <BarChart
          data={typeData}
          index="Type"
          categories={["OpenAlex", "HAL"]}
          colors={["blue", "amber"]}
          valueFormatter={formatInt}
          yAxisWidth={56}
          className="h-64"
          layout="vertical"
        />
      </div>

      <p className="text-xs text-slate-400">
        Méthode : appariement déterministe sur DOI normalisé, puis repli probabiliste (blocking année + préfixe
        de titre, similarité de Jaccard) pour les notices sans DOI. La couverture partielle illustre la
        complémentarité des deux sources et justifie leur consolidation dans l&apos;entrepôt décisionnel.
      </p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>
    </div>
  );
}
