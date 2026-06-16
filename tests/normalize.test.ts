import { describe, expect, it } from "vitest";
import { normalizeDoi, normalizeTitle, reconstructAbstract, tokenSet } from "../pipeline/transform/normalize";

describe("normalizeDoi", () => {
  it("strips scheme/host and lowercases", () => {
    expect(normalizeDoi("https://doi.org/10.1051/0004-6361")).toBe("10.1051/0004-6361");
    expect(normalizeDoi("DOI:10.1/ABC")).toBe("10.1/abc");
  });
  it("returns null for empty input", () => {
    expect(normalizeDoi(null)).toBeNull();
    expect(normalizeDoi("")).toBeNull();
  });
});

describe("normalizeTitle", () => {
  it("removes HTML, diacritics and punctuation", () => {
    expect(normalizeTitle("<i>Héllo</i>, World!")).toBe("hello world");
  });
});

describe("tokenSet", () => {
  it("keeps unique multi-char tokens", () => {
    expect([...tokenSet("the big big study")].sort()).toEqual(["big", "study", "the"]);
  });
});

describe("reconstructAbstract", () => {
  it("rebuilds text from an inverted index", () => {
    expect(reconstructAbstract({ hello: [0], world: [1] })).toBe("hello world");
    expect(reconstructAbstract(null)).toBeNull();
  });
});
