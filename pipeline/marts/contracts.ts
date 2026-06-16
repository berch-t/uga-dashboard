/**
 * Contracts mart builder (scanR funding export, MESR open data).
 *
 * Pure transform: parsed CSV rows in, `ContractsMart` out. Covers the
 * "valorisation / contrats de recherche" scope of the job offer.
 */

import type { ContractsMart } from "./schema";

interface ContractRow {
  code: string;
  acronym: string;
  title: string;
  year: string;
  amount_eur: string;
  duration_months: string;
  program: string;
  coordinator: string;
}

const num = (v: string): number | null => (v && !Number.isNaN(Number(v)) ? Number(v) : null);

export function buildContracts(rows: Array<Record<string, string>>, topN = 8): ContractsMart {
  const contracts = rows as unknown as ContractRow[];

  const years = contracts.map((c) => num(c.year)).filter((y): y is number => y !== null);
  const amounts = contracts.map((c) => num(c.amount_eur)).filter((a): a is number => a !== null);
  const totalFunding = amounts.reduce((s, a) => s + a, 0);

  // Aggregate by year.
  const byYearMap = new Map<number, { projects: number; fundingEur: number }>();
  for (const c of contracts) {
    const y = num(c.year);
    if (y === null) continue;
    const cur = byYearMap.get(y) ?? { projects: 0, fundingEur: 0 };
    cur.projects += 1;
    cur.fundingEur += num(c.amount_eur) ?? 0;
    byYearMap.set(y, cur);
  }
  const byYear = [...byYearMap.entries()]
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => a.year - b.year);

  // Top funding programmes.
  const programMap = new Map<string, number>();
  for (const c of contracts) {
    const p = c.program?.trim();
    if (p) programMap.set(p, (programMap.get(p) ?? 0) + 1);
  }
  const topPrograms = [...programMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  // Most recent / highest-funded projects for the table.
  // Showcase table: recent contracts whose UGA funding share is known, so the
  // "Part UGA" column is populated (national calls like ANR rarely expose an
  // amount in scanR; European programmes do). Most recent first, then largest.
  const recent = [...contracts]
    .filter((c) => (c.title || c.acronym) && num(c.amount_eur) !== null)
    .sort((a, b) => (num(b.year) ?? 0) - (num(a.year) ?? 0) || (num(b.amount_eur) ?? 0) - (num(a.amount_eur) ?? 0))
    .slice(0, 12)
    .map((c) => ({
      acronym: c.acronym || c.code,
      title: c.title || "—",
      year: num(c.year),
      amountEur: num(c.amount_eur),
      program: c.program || "—",
      coordinator: c.coordinator || "—",
    }));

  return {
    source: "scanR — financements de la recherche (MESR, data.gouv.fr)",
    period: { fromYear: years.length ? Math.min(...years) : 0, toYear: years.length ? Math.max(...years) : 0 },
    totalProjects: contracts.length,
    fundedProjects: amounts.length,
    totalFundingEur: totalFunding,
    meanFundingEur: amounts.length ? totalFunding / amounts.length : 0,
    byYear,
    topPrograms,
    recent,
  };
}
