import { describe, it, expect } from "vitest";
import { lookupCd } from "./neighborhoods";
describe("lookupCd", () => {
  it("matches a neighborhood name", () => { expect(lookupCd("jamaica")).toBe("412"); });
  it("is case-insensitive and trims", () => { expect(lookupCd("  Flushing ")).toBe("407"); });
  it("matches South Ozone Park to CD10", () => { expect(lookupCd("south ozone park")).toBe("410"); });
  it("returns null for unknown", () => { expect(lookupCd("nowheresville")).toBeNull(); });
  it("matches north corona to 403", () => { expect(lookupCd("north corona")).toBe("403"); });
  it("matches flushing (direct)", () => { expect(lookupCd("flushing")).toBe("407"); });
  it("short token 'park' returns null (false-positive guard)", () => { expect(lookupCd("park")).toBeNull(); });
  it("query-contains-key: downtown flushing maps to 407", () => { expect(lookupCd("downtown flushing")).toBe("407"); });

  // Citywide reference neighborhoods
  it("harlem → 110", () => { expect(lookupCd("harlem")).toBe("110"); });
  it("central harlem → 110", () => { expect(lookupCd("central harlem")).toBe("110"); });
  it("washington heights → 112", () => { expect(lookupCd("washington heights")).toBe("112"); });
  it("wash heights → 112", () => { expect(lookupCd("wash heights")).toBe("112"); });
  it("lower east side → 103", () => { expect(lookupCd("lower east side")).toBe("103"); });
  it("les → 103", () => { expect(lookupCd("les")).toBe("103"); });
  it("mott haven → 201", () => { expect(lookupCd("mott haven")).toBe("201"); });
  it("south bronx → 201", () => { expect(lookupCd("south bronx")).toBe("201"); });
  it("fordham → 205", () => { expect(lookupCd("fordham")).toBe("205"); });
  it("grand concourse → 205", () => { expect(lookupCd("grand concourse")).toBe("205"); });
  it("bed-stuy → 303", () => { expect(lookupCd("bed-stuy")).toBe("303"); });
  it("bedford-stuyvesant → 303", () => { expect(lookupCd("bedford-stuyvesant")).toBe("303"); });
  it("bedford stuyvesant → 303", () => { expect(lookupCd("bedford stuyvesant")).toBe("303"); });
  it("crown heights → 308", () => { expect(lookupCd("crown heights")).toBe("308"); });
  it("brownsville → 316", () => { expect(lookupCd("brownsville")).toBe("316"); });
});
