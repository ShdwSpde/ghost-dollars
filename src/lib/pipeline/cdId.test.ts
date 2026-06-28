import { describe, it, expect } from "vitest";
import { normalizeCdId, cdNumber, isPlaceable } from "./cdId";

describe("normalizeCdId", () => {
  it("passes through 3-digit boro_cd", () => { expect(normalizeCdId("412")).toBe("412"); });
  it("handles numeric input", () => { expect(normalizeCdId(412)).toBe("412"); });
  it("parses 'Queens 12'", () => { expect(normalizeCdId("Queens 12")).toBe("412"); });
  it("parses 'Q12'", () => { expect(normalizeCdId("Q12")).toBe("412"); });
  it("pads single-digit CD numbers", () => { expect(normalizeCdId("Q3")).toBe("403"); });
  it("returns null for citywide", () => { expect(normalizeCdId("Citywide")).toBeNull(); });
  it("returns null for empty/missing", () => { expect(normalizeCdId("")).toBeNull(); expect(normalizeCdId(null)).toBeNull(); });
});
describe("cdNumber", () => { it("extracts CD number", () => { expect(cdNumber("412")).toBe(12); expect(cdNumber("403")).toBe(3); }); });
describe("isPlaceable", () => {
  it("true for residential CD", () => { expect(isPlaceable("412")).toBe(true); });
  it("false for Joint Interest Area (>=64)", () => { expect(isPlaceable("481")).toBe(false); });
  it("false for null", () => { expect(isPlaceable(null)).toBe(false); });
});
