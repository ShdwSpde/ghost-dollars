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
});
