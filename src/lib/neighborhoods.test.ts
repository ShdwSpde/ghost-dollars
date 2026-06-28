import { describe, it, expect } from "vitest";
import { lookupCd } from "./neighborhoods";
describe("lookupCd", () => {
  it("matches a neighborhood name", () => { expect(lookupCd("jamaica")).toBe("412"); });
  it("is case-insensitive and trims", () => { expect(lookupCd("  Flushing ")).toBe("407"); });
  it("matches South Ozone Park to CD10", () => { expect(lookupCd("south ozone park")).toBe("410"); });
  it("returns null for unknown", () => { expect(lookupCd("nowheresville")).toBeNull(); });
});
