import { describe, it, expect } from "vitest";
import { buildMetrics } from "./metrics";

const demo = new Map([
  ["412", { boroCd: "412", population: 100, medianHhIncome: 50000, pctBipoc: 90, povertyRate: 15 }],
  ["403", { boroCd: "403", population: 100, medianHhIncome: 60000, pctBipoc: 80, povertyRate: 12 }],
]);

describe("buildMetrics", () => {
  it("computes parity as total visible / total population over placeable CDs", () => {
    const agg = { visibleByCd: new Map([["412", 100], ["403", 300]]), totalVisible: 400, totalDark: 600 };
    const ds = buildMetrics(demo, agg);
    expect(ds.meta.parityPerResident).toBe(2); // 400 / 200
    expect(ds.meta.darkSharePct).toBeCloseTo(60); // 600 / (400+600)
  });
  it("computes ghost dollars = expected - visible", () => {
    const agg = { visibleByCd: new Map([["412", 100], ["403", 300]]), totalVisible: 400, totalDark: 0 };
    const ds = buildMetrics(demo, agg);
    const cd412 = ds.cds.find((c) => c.boroCd === "412")!;
    expect(cd412.expectedCapital).toBe(200); // parity 2 * pop 100
    expect(cd412.ghostDollars).toBe(100);    // 200 - 100 (under parity)
  });
  it("assigns percentile rank of per-resident capital (lowest = 0)", () => {
    const agg = { visibleByCd: new Map([["412", 100], ["403", 300]]), totalVisible: 400, totalDark: 0 };
    const ds = buildMetrics(demo, agg);
    expect(ds.cds.find((c) => c.boroCd === "412")!.perResidentPercentile).toBe(0);
    expect(ds.cds.find((c) => c.boroCd === "403")!.perResidentPercentile).toBe(100);
  });
  it("flags corridor CDs with notes", () => {
    const agg = { visibleByCd: new Map([["412", 100], ["403", 300]]), totalVisible: 400, totalDark: 0 };
    const cd412 = buildMetrics(demo, agg).cds.find((c) => c.boroCd === "412")!;
    expect(cd412.inCorridor).toBe(true);
  });
  it("treats a CD with demographics but zero visible capital as ghost = expected", () => {
    const agg = { visibleByCd: new Map([["403", 300]]), totalVisible: 300, totalDark: 0 };
    const cd412 = buildMetrics(demo, agg).cds.find((c) => c.boroCd === "412")!;
    expect(cd412.visibleCapital).toBe(0);
    expect(cd412.ghostDollars).toBe(cd412.expectedCapital);
  });
});
