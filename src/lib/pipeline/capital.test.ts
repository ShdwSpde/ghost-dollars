import { describe, it, expect } from "vitest";
import { aggregateCapital } from "./capital";

describe("aggregateCapital", () => {
  it("uses only the latest period, dedups by fms_id|budget_line, splits multi-CD equally, pools the rest as dark", () => {
    const recs = [
      // older period — must be ignored entirely
      { reporting_period: "202405", fms_id: "OLD", budget_line: "L1", community_board: "412", total_budget: "99999" },
      // latest period
      { reporting_period: "202601", fms_id: "A", budget_line: "L1", community_board: "412", total_budget: "1000" },
      { reporting_period: "202601", fms_id: "A", budget_line: "L1", community_board: "412", total_budget: "1000" }, // dup -> ignored
      { reporting_period: "202601", fms_id: "B", budget_line: "L1", community_board: "Manhattan, Manhattan 03", total_budget: "600" }, // single CD via comma
      { reporting_period: "202601", fms_id: "C", budget_line: "L1", community_board: "Queens 07, Queens 08", total_budget: "400" }, // multi -> 200/200
      { reporting_period: "202601", fms_id: "D", budget_line: "L1", community_board: "Citywide", total_budget: "5000" }, // dark
      { reporting_period: "202601", fms_id: "E", budget_line: "L1", community_board: "Brooklyn", total_budget: "700" }, // dark (borough only)
    ];
    const agg = aggregateCapital(recs);
    expect(agg.visibleByCd.get("412")).toBe(1000); // old period + dup both ignored
    expect(agg.visibleByCd.get("103")).toBe(600);  // Manhattan 03
    expect(agg.visibleByCd.get("407")).toBe(200);  // Queens 07 half
    expect(agg.visibleByCd.get("408")).toBe(200);  // Queens 08 half
    expect(agg.totalVisible).toBe(2000);           // 1000 + 600 + 400
    expect(agg.totalDark).toBe(5700);              // 5000 + 700
  });
});
