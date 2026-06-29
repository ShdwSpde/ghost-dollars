import { describe, it, expect } from "vitest";
import { aggregateCapital } from "./capital";
import type { CapitalRecord } from "./capital";

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

  it("accumulates bucket totals; multi-CD split applies to bucket dollars too", () => {
    const recs: CapitalRecord[] = [
      // $1000 neighborhood (DOE) → CD412
      {
        reporting_period: "202601", fms_id: "N1", budget_line: "B1",
        community_board: "412", total_budget: "1000",
        managing_agency: "DOE", ten_year_plan_category: "SCHOOL CONSTRUCTION",
      },
      // $800 citywide (DDC) → CD407 and CD408 split equally ($400 each)
      {
        reporting_period: "202601", fms_id: "C1", budget_line: "B2",
        community_board: "Queens 07, Queens 08", total_budget: "800",
        managing_agency: "DDC", ten_year_plan_category: "HIGHWAY RECONSTRUCTION",
      },
      // $200 unknown agency → CD412 → bucket "other"
      {
        reporting_period: "202601", fms_id: "O1", budget_line: "B3",
        community_board: "412", total_budget: "200",
        managing_agency: "UNKNOWN_AGENCY", ten_year_plan_category: "MISC",
      },
    ];
    const agg = aggregateCapital(recs);

    // Existing visible totals unchanged
    expect(agg.visibleByCd.get("412")).toBe(1200); // 1000 + 200
    expect(agg.visibleByCd.get("407")).toBe(400);
    expect(agg.totalVisible).toBe(2000);

    // CD 412 buckets
    const b412 = agg.bucketsByCd?.get("412")!;
    expect(b412.neighborhood).toBe(1000); // DOE
    expect(b412.other).toBe(200);         // UNKNOWN_AGENCY
    expect(b412.citywide).toBe(0);

    // CD 407 buckets — gets half of the DDC row
    const b407 = agg.bucketsByCd?.get("407")!;
    expect(b407.citywide).toBe(400);
    expect(b407.neighborhood).toBe(0);
    expect(b407.other).toBe(0);

    // CD 408 gets the other half
    const b408 = agg.bucketsByCd?.get("408")!;
    expect(b408.citywide).toBe(400);

    // Top categories for CD 412
    const cats412 = agg.rawCategoryByCd?.get("412")!;
    expect(cats412.get("SCHOOL CONSTRUCTION")).toBe(1000);
    expect(cats412.get("MISC")).toBe(200);
  });
});
