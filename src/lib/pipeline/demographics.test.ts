import { describe, it, expect } from "vitest";
import { parseDemographicsCsv } from "./demographics";

const CSV = `boro_cd,population,median_hh_income,pct_bipoc,poverty_rate
412,225919,67000,93.2,15.1
403,171576,58000,88.0,17.4
,100,,,`;

describe("parseDemographicsCsv", () => {
  it("parses rows keyed by boroCd", () => {
    const m = parseDemographicsCsv(CSV);
    expect(m.get("412")?.population).toBe(225919);
    expect(m.get("412")?.medianHhIncome).toBe(67000);
    expect(m.get("403")?.pctBipoc).toBeCloseTo(88.0);
  });
  it("skips rows with no parseable boro_cd", () => {
    expect(parseDemographicsCsv(CSV).has("")).toBe(false);
  });
  it("coerces blank numerics to null", () => {
    const csv = `boro_cd,population,median_hh_income,pct_bipoc,poverty_rate\n412,225919,,,`;
    const d = parseDemographicsCsv(csv).get("412")!;
    expect(d.medianHhIncome).toBeNull();
    expect(d.povertyRate).toBeNull();
  });
});
