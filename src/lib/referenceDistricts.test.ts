import { describe, it, expect } from "vitest";
import { referenceNote } from "./referenceDistricts";

describe("referenceNote", () => {
  it("returns a note for CD110 (Central Harlem) mentioning Harlem", () => {
    const note = referenceNote("110");
    expect(note).toBeDefined();
    expect(note).toMatch(/[Hh]arlem/);
  });

  it("returns undefined for a corridor CD not in the reference set (404)", () => {
    expect(referenceNote("404")).toBeUndefined();
  });

  it("returns a note for CD303 (Bed-Stuy)", () => {
    expect(referenceNote("303")).toMatch(/[Bb]ed[\-\s][Ss]tuy/);
  });

  it("returns a note for CD316 (Brownsville)", () => {
    expect(referenceNote("316")).toMatch(/[Bb]rownsville/);
  });

  it("returns undefined for a completely unknown CD", () => {
    expect(referenceNote("999")).toBeUndefined();
  });
});
