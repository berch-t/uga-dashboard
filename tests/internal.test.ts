import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "../pipeline/connectors/csv";
import { buildContracts } from "../pipeline/marts/contracts";

describe("CSV round-trip", () => {
  it("parses quoted fields with commas and escaped quotes", () => {
    const text = 'a,b\n"hello, world","say ""hi"""\n1,2';
    const rows = parseCsv(text);
    expect(rows).toEqual([
      { a: "hello, world", b: 'say "hi"' },
      { a: "1", b: "2" },
    ]);
  });
  it("serialises with proper escaping", () => {
    const csv = toCsv([{ x: "a,b", y: 'c"d' }], ["x", "y"]);
    expect(csv).toBe('x,y\n"a,b","c""d"');
  });
});

describe("buildContracts", () => {
  const rows = [
    { code: "ANR-1", acronym: "ALPHA", title: "Projet A", year: "2014", amount_eur: "100000", duration_months: "36", program: "Blanc", coordinator: "UGA" },
    { code: "ANR-2", acronym: "BETA", title: "Projet B", year: "2014", amount_eur: "", duration_months: "24", program: "Blanc", coordinator: "CNRS" },
    { code: "ANR-3", acronym: "GAMMA", title: "Projet C", year: "2016", amount_eur: "300000", duration_months: "48", program: "JCJC", coordinator: "UGA" },
  ];
  it("aggregates projects, funding and programmes", () => {
    const mart = buildContracts(rows);
    expect(mart.totalProjects).toBe(3);
    expect(mart.fundedProjects).toBe(2);
    expect(mart.totalFundingEur).toBe(400000);
    expect(mart.meanFundingEur).toBe(200000);
    expect(mart.period).toEqual({ fromYear: 2014, toYear: 2016 });
    expect(mart.topPrograms[0]).toEqual({ name: "Blanc", count: 2 });
    expect(mart.byYear).toEqual([
      { year: 2014, projects: 2, fundingEur: 100000 },
      { year: 2016, projects: 1, fundingEur: 300000 },
    ]);
  });
});
