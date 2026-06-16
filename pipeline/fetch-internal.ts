/**
 * Generate the "internal files" from real, public sources.
 *
 * The UGA's true internal exports (research-management tools) are confidential,
 * so we materialise equivalent REAL structured files:
 *   - data/internal/publications.csv  <- HAL (publication-list export)
 *   - data/internal/contracts.csv     <- ANR open data (funded research contracts)
 *
 * These files are then ingested by the generic `FileConnector`, exactly as a
 * gestion-tool export would be. Run with: `npm run internal`.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { fetchJson, politeDelay, qs } from "./connectors/http";
import { toCsv } from "./connectors/csv";
import { HalConnector } from "./connectors/hal";
import { CANONICAL_TYPE_LABELS } from "./transform/taxonomy";

const OUT_DIR = "data/internal";
const log = (m: string) => console.log(`[internal] ${m}`);

/** HAL publication-list export (per-publication rows). */
async function buildPublicationsCsv(): Promise<void> {
  const hal = new HalConnector();
  const works = await hal.fetchSample({ fromYear: 2019, toYear: 2024, maxWorks: 1200, requireDoi: true });
  const rows = works.map((w) => ({
    reference: w.id,
    doi: w.doi ?? "",
    title: w.title,
    year: w.year ?? "",
    type: CANONICAL_TYPE_LABELS[w.type],
    journal: w.venue ?? "",
    // First authors only: keeps the export light (hyperauthorship papers aside).
    authors: w.authors.slice(0, 6).map((a) => a.name).join("; ") + (w.authors.length > 6 ? " et al." : ""),
  }));
  const csv = toCsv(rows, ["reference", "doi", "title", "year", "type", "journal", "authors"]);
  await writeFile(`${OUT_DIR}/publications.csv`, csv, "utf8");
  log(`publications.csv : ${rows.length} lignes (source HAL)`);
}

/**
 * scanR funding record (MESR open data). Several fields are JSON encoded as
 * strings: `participants` (array of orgs with role/funding), `acronym`,
 * `label`, `call` (multilingual objects).
 */
interface ScanrRecord {
  id?: string;
  type?: string; // funder / instrument: ANR, PIA ANR, H2020, Horizon Europe, FP7…
  year?: string;
  participants?: string;
  acronym?: string;
  label?: string;
}

interface ScanrParticipant {
  role?: string;
  funding?: string; // amount as a French-formatted string, e.g. "168277,2"
  label?: { default?: string };
}

/** Parse a multilingual JSON string field, preferring French. */
function pickText(raw: string | undefined): string {
  if (!raw) return "";
  try {
    const obj = JSON.parse(raw) as Record<string, string>;
    return obj.fr ?? obj.default ?? obj.en ?? Object.values(obj)[0] ?? "";
  } catch {
    return "";
  }
}

/** Strip the "ORG NAME__-__CONTRACT-CODE" suffix scanR appends to org labels. */
const orgName = (label?: string): string => (label ?? "").split("__-__")[0]!.trim();

/**
 * Research-contract export from scanR (the MESR's funding catalogue). Far more
 * recent and complete than the legacy ANR-only file (covers ANR, PIA, H2020,
 * Horizon Europe, FP7…, up to the current year). Filtered to projects with a
 * Université Grenoble Alpes participant. The UGA partner's own funding share is
 * extracted when present.
 */
async function buildContractsCsv(): Promise<void> {
  const base =
    "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/export-des-financements-exposes-dans-scanr/records";
  const where = encodeURIComponent('search(participants, "Grenoble Alpes")');
  const rows: Array<Record<string, string | number | null>> = [];

  for (let offset = 0; offset < 2000; offset += 100) {
    const url = `${base}?where=${where}&${qs({ limit: 100, offset, order_by: "year desc" })}`;
    const data = await fetchJson<{ total_count: number; results: ScanrRecord[] }>(url);
    for (const r of data.results) {
      let participants: ScanrParticipant[] = [];
      try {
        participants = JSON.parse(r.participants ?? "[]") as ScanrParticipant[];
      } catch {
        participants = [];
      }
      // UGA partner funding share (sum if several UGA entities are listed).
      const ugaFunding = participants
        .filter((p) => /grenoble alpes/i.test(p.label?.default ?? ""))
        .reduce((s, p) => s + (p.funding ? Number(p.funding.replace(/\s/g, "").replace(",", ".")) || 0 : 0), 0);
      const coordinator = participants.find((p) => p.role === "coordinator");

      rows.push({
        code: r.id ?? "",
        acronym: pickText(r.acronym),
        title: pickText(r.label),
        year: r.year ?? "",
        amount_eur: ugaFunding > 0 ? Math.round(ugaFunding) : "",
        duration_months: "", // not exposed by scanR
        program: r.type ?? "", // funder / instrument (becomes "financeur" in the UI)
        coordinator: orgName(coordinator?.label?.default),
      });
    }
    if (data.results.length < 100) break;
    await politeDelay();
  }

  const csv = toCsv(rows, ["code", "acronym", "title", "year", "amount_eur", "duration_months", "program", "coordinator"]);
  await writeFile(`${OUT_DIR}/contracts.csv`, csv, "utf8");
  log(`contracts.csv : ${rows.length} lignes (source scanR / MESR)`);
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  await Promise.all([buildPublicationsCsv(), buildContractsCsv()]);
  log("done.");
}

main().catch((err) => {
  console.error("[internal] FAILED:", err);
  process.exit(1);
});
