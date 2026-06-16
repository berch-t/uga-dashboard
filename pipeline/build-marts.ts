/**
 * Pipeline orchestrator — the "ETL" that feeds the dashboard's data marts.
 *
 * Run with:   npm run pipeline        (full build, writes data/marts/*.json)
 *             npm run pipeline:dry    (connectivity + counts only, no writes)
 *
 * Design: fetch raw data via the connectors, transform with the pure builders,
 * write versioned JSON marts plus a manifest documenting provenance.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "./config";
import { OpenAlexConnector } from "./connectors/openalex";
import { HalConnector } from "./connectors/hal";
import { FileConnector } from "./connectors/file";
import { parseCsv } from "./connectors/csv";
import { politeDelay } from "./connectors/http";
import * as build from "./marts/builders";
import { buildContracts } from "./marts/contracts";
import type { Manifest, ReconciliationMart } from "./marts/schema";

const log = (msg: string) => console.log(`[pipeline] ${msg}`);
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

async function writeMart(name: string, data: unknown): Promise<void> {
  await mkdir(config.outDir, { recursive: true });
  await writeFile(join(config.outDir, `${name}.json`), JSON.stringify(data), "utf8");
  log(`wrote ${config.outDir}/${name}.json`);
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const oa = new OpenAlexConnector();
  const hal = new HalConnector();
  const years = range(config.timeSeries.fromYear, config.timeSeries.toYear);

  log(`institution: ${config.institution.name} (${config.institution.openAlexId})`);

  // --- Full-corpus aggregates (cheap, exhaustive) --------------------------
  const [total, byYear, typeAgg, oaStatusAgg, sourceAgg, authorsAgg, globalTopics, halTotal] =
    await Promise.all([
      oa.fetchTotal(),
      oa.groupBy("publication_year"),
      oa.groupBy("type"),
      oa.groupBy("open_access.oa_status"),
      oa.groupBy("primary_location.source.id"),
      oa.groupBy("authorships.author.id"),
      oa.groupBy("primary_topic.id"),
      hal.fetchTotal(),
    ]);
  log(`OpenAlex corpus: ${total.toLocaleString("fr")} works | HAL corpus: ${halTotal.toLocaleString("fr")}`);

  if (dryRun) {
    log("dry-run OK — APIs reachable, aggregates returned. No marts written.");
    return;
  }

  const totalsByYear = new Map(byYear.map((b) => [Number(b.key), b.count]));

  // --- Year-sliced series (topics × year, OA × year) -----------------------
  log("fetching year-sliced aggregations…");
  const perYearTopics = new Map<number, Awaited<ReturnType<typeof oa.groupByForYear>>>();
  const oaByYear: Array<{ year: number; oaWorks: number; total: number }> = [];
  for (const y of years) {
    perYearTopics.set(y, await oa.groupByForYear("primary_topic.id", y));
    await politeDelay();
    const isOa = await oa.groupByForYear("open_access.is_oa", y);
    oaByYear.push({
      year: y,
      // OpenAlex renvoie la clé booléenne comme "1"/"0" et le libellé "true"/"false" ;
      // on s'appuie sur le libellé pour rester robuste aux deux représentations.
      oaWorks: isOa.find((b) => b.label === "true" || b.key === "true" || b.key === "1")?.count ?? 0,
      total: totalsByYear.get(y) ?? 0,
    });
    await politeDelay();
  }

  // --- Per-work data (sample + top-cited + HAL sample) ---------------------
  log("fetching analytical sample, top-cited works and HAL sample…");
  const [sample, topCited, halSample] = await Promise.all([
    oa.fetchSample(config.sample),
    oa.fetchTopCited(config.bibliometrics.topCitedCount),
    hal.fetchSample({ ...config.reconciliation, maxWorks: config.reconciliation.maxPerSource, requireDoi: true }),
  ]);
  log(`sample=${sample.length} | topCited=${topCited.length} | halSample=${halSample.length}`);

  // i10-index : décompte sur le corpus COMPLET (et non sur le top-cité, qui le
  // bornerait à sa propre taille). h/g, eux, convergent dans le top-cité.
  const i10Full = await oa.fetchCountWithMinCitations(10);

  // --- Build marts ---------------------------------------------------------
  log("building marts…");
  await writeMart("overview", build.buildOverview({
    totalWorks: total, byYear, typeAgg, oaStatusAgg, oaByYear,
    yearRange: { fromYear: config.timeSeries.fromYear, toYear: config.timeSeries.toYear },
  }));
  await writeMart("sources", build.buildSources(sourceAgg));
  await writeMart("bibliometrics", build.buildBibliometrics(topCited, sample, i10Full));
  await writeMart("topics", build.buildTopics({ years, globalTopics, perYear: perYearTopics, totalsByYear }));
  await writeMart("authors", build.buildAuthors(authorsAgg, sample));
  await writeMart("network", build.buildNetwork(sample));
  await writeMart("papers", build.buildPapers(topCited));

  // --- Internal files (3rd source) : publications export + ANR contracts -----
  log("ingesting internal files (publications + contracts)…");
  const reconWindow = { fromYear: config.reconciliation.fromYear, toYear: config.reconciliation.toYear };
  const internalPubs = await new FileConnector(config.internal.publicationsCsv, {
    id: "reference", title: "title", doi: "doi", year: "year", venue: "journal",
  }).fetchSample();
  const internalDois = [...new Set(internalPubs.map((p) => p.doi).filter((d): d is string => !!d))];
  const foundDois = await oa.findExistingDois(internalDois);
  const reconciliation: ReconciliationMart = {
    ...build.buildReconciliation(sample, halSample, reconWindow),
    internalSource: {
      fileName: "publications.csv",
      records: internalPubs.length,
      recordsWithDoi: internalDois.length,
      matchedToOpenAlex: foundDois.size,
      coverage: internalDois.length ? foundDois.size / internalDois.length : 0,
    },
  };
  await writeMart("reconciliation", reconciliation);

  const contractRows = parseCsv(await readFile(config.internal.contractsCsv, "utf8"));
  await writeMart("contracts", buildContracts(contractRows));

  const manifest: Manifest = {
    institution: {
      name: config.institution.name,
      openAlexId: config.institution.openAlexId,
      halStructAcronym: config.institution.halStructAcronym,
    },
    generatedAt: new Date().toISOString(),
    sources: {
      openAlex: { total, endpoint: config.openAlex.baseUrl },
      hal: { total: halTotal, endpoint: config.hal.baseUrl },
    },
    corpus: {
      fullWorks: total,
      sampleWorks: sample.length,
      sampleWindow: `${config.sample.fromYear}–${config.sample.toYear}`,
      topCited: topCited.length,
    },
    marts: ["overview", "sources", "bibliometrics", "topics", "authors", "network", "reconciliation", "papers", "contracts"],
  };
  await writeMart("manifest", manifest);

  log("done.");
}

main().catch((err) => {
  console.error("[pipeline] FAILED:", err);
  process.exit(1);
});
