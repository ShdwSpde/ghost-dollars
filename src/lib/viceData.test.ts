import { describe, it, expect } from "vitest";
import { viceFor } from "./viceData";

describe("viceFor", () => {
  it("returns real entry for 410 (South Ozone Park / Resorts World)", () => {
    const v = viceFor("410");
    expect(v).not.toBeNull();
    expect(v!.isProjection).toBe(false);
    expect(v!.wonHereAnnual).toBe(692_400_000);
    expect(v!.toAlbanyAnnual).toBe(277_000_000);
    expect(v!.cumulativeToState).toBe(4_750_000_000);
    expect(v!.label).toContain("Resorts World");
  });

  it("returns projection entry for 407 (Flushing / Metropolitan Park)", () => {
    const v = viceFor("407");
    expect(v).not.toBeNull();
    expect(v!.isProjection).toBe(true);
    expect(v!.projectedRevenueAnnual).toBe(3_900_000_000);
    expect(v!.projectedTaxesAnnual).toBe(850_000_000);
    expect(v!.communityPledge).toBe(1_750_000_000);
    expect(v!.label).toContain("Metropolitan Park");
  });

  it("returns null for a non-casino district (412)", () => {
    expect(viceFor("412")).toBeNull();
  });

  it("returns null for an unknown/invalid id (999)", () => {
    expect(viceFor("999")).toBeNull();
  });
});
