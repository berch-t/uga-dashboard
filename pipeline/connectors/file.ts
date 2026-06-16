/**
 * Generic file connector: ingests a structured CSV export as a source.
 *
 * Demonstrates the "fichiers internes" activity of the job spec — the same
 * `Connector` contract as the API sources, so a management-tool export flows
 * through the identical fiabilisation/reconciliation chain. A column map keeps
 * it source-agnostic: point it at any CSV and describe its columns.
 */

import { readFile } from "node:fs/promises";
import { parseCsv } from "./csv";
import { normalizeDoi } from "../transform/normalize";
import type { AggBucket, CanonicalWork, Connector } from "./types";

export interface FileColumnMap {
  id: string;
  title: string;
  doi?: string;
  year?: string;
  venue?: string;
}

export class FileConnector implements Connector {
  readonly id = "file" as const;

  constructor(private readonly filePath: string, private readonly map: FileColumnMap) {}

  private async readRows(): Promise<Array<Record<string, string>>> {
    const text = await readFile(this.filePath, "utf8");
    return parseCsv(text);
  }

  async fetchTotal(): Promise<number> {
    return (await this.readRows()).length;
  }

  /** Not meaningful for an arbitrary file; kept for interface symmetry. */
  async fetchTypeFacets(): Promise<AggBucket[]> {
    return [];
  }

  async fetchSample(): Promise<CanonicalWork[]> {
    const rows = await this.readRows();
    return rows.map((row, i) => {
      const yearRaw = this.map.year ? row[this.map.year] : undefined;
      const year = yearRaw && /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null;
      return {
        id: row[this.map.id] || `file:${i}`,
        source: "file" as const,
        doi: normalizeDoi(this.map.doi ? row[this.map.doi] : null),
        title: row[this.map.title] ?? "",
        year,
        type: "Other",
        citations: 0,
        oaStatus: null,
        authors: [],
        institutions: [],
        topic: null,
        venue: this.map.venue ? row[this.map.venue] ?? null : null,
        abstract: null,
      };
    });
  }
}
