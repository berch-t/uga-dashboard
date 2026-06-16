import { describe, expect, it } from "vitest";
import { gIndex, hIndex, i10Index } from "../pipeline/analytics/bibliometrics";
import { openAlexTypeToCanonical, halDocTypeToCanonical } from "../pipeline/transform/taxonomy";

describe("bibliometric indices", () => {
  const citations = [10, 8, 5, 4, 3];
  it("computes the h-index (Hirsch)", () => {
    expect(hIndex(citations)).toBe(4);
    expect(hIndex([])).toBe(0);
  });
  it("computes the g-index (Egghe)", () => {
    expect(gIndex(citations)).toBe(5);
  });
  it("computes the i10-index", () => {
    expect(i10Index(citations)).toBe(1);
  });
});

describe("taxonomy harmonisation", () => {
  it("maps OpenAlex IRIs and slugs", () => {
    expect(openAlexTypeToCanonical("https://openalex.org/types/article")).toBe("Article");
    expect(openAlexTypeToCanonical("dataset")).toBe("Dataset");
    expect(openAlexTypeToCanonical("unknown-thing")).toBe("Other");
  });
  it("maps HAL doc types", () => {
    expect(halDocTypeToCanonical("THESE")).toBe("Thesis");
    expect(halDocTypeToCanonical("COMM")).toBe("ConferencePaper");
  });
});
