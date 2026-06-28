import { describe, it, expect } from "vitest";
import { receiptLines } from "./civicCosts";

describe("receiptLines", () => {
  it("returns [] for 0 ghost dollars", () => {
    expect(receiptLines(0)).toEqual([]);
  });

  it("returns [] for negative ghost dollars", () => {
    expect(receiptLines(-1_000_000)).toEqual([]);
  });

  it("computes correct quantities for 360M", () => {
    const lines = receiptLines(360_000_000);
    const byLabel = Object.fromEntries(lines.map((l) => [l.label, l]));
    expect(byLabel["school seats"].qty).toBe(2000);          // 360M / 180K = 2000 exactly
    expect(byLabel["lane-miles repaved"].qty).toBe(1800);     // 360M / 200K = 1800 exactly
    expect(byLabel["NYCHA apartments repaired"].qty).toBe(742); // floor(360M / 485K) = 742
    expect(byLabel["neighborhood playgrounds"].qty).toBe(90); // 360M / 4M = 90 exactly
  });

  it("skips lines whose qty is 0 (100K buys nothing)", () => {
    // 100_000 < SCHOOL_SEAT(180K), < STREET_LANE_MILE(200K), < NYCHA_UNIT(485K), < PLAYGROUND(4M)
    expect(receiptLines(100_000)).toEqual([]);
  });

  it("returns only school seats for 190K (above school cost, below lane-mile cost)", () => {
    // 190_000 / 180_000 = 1 school seat; 190_000 / 200_000 = 0 lane-miles (floor)
    const lines = receiptLines(190_000);
    expect(lines).toHaveLength(1);
    expect(lines[0].label).toBe("school seats");
    expect(lines[0].qty).toBe(1);
  });

  it("every ReceiptLine has label, qty, unit", () => {
    const lines = receiptLines(1_000_000_000);
    for (const l of lines) {
      expect(typeof l.label).toBe("string");
      expect(typeof l.qty).toBe("number");
      expect(typeof l.unit).toBe("string");
      expect(l.qty).toBeGreaterThan(0);
    }
  });
});
