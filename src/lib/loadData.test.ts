import { describe, it, expect } from "vitest";
import { getMetricValue } from "./loadData";

const cd = { boroCd: "412", visibleCapital: 1500, perResidentCapital: 7.5, ghostDollars: 300 } as any;
describe("getMetricValue", () => {
  it("returns the field for each metric key", () => {
    expect(getMetricValue(cd, "actual")).toBe(1500);
    expect(getMetricValue(cd, "perResident")).toBe(7.5);
    expect(getMetricValue(cd, "ghost")).toBe(300);
  });
});
