import { describe, it, expect } from "vitest";
import { linearRegression } from "./regression";

describe("linearRegression", () => {
  it("fits a perfect line", () => {
    const r = linearRegression([{x:0,y:0},{x:1,y:2},{x:2,y:4}]);
    expect(r.slope).toBeCloseTo(2);
    expect(r.intercept).toBeCloseTo(0);
    expect(r.r2).toBeCloseTo(1);
  });
  it("handles a downward slope", () => {
    const r = linearRegression([{x:0,y:10},{x:1,y:8},{x:2,y:6}]);
    expect(r.slope).toBeCloseTo(-2);
  });
  it("returns slope 0 for fewer than 2 points", () => {
    expect(linearRegression([{x:1,y:1}]).slope).toBe(0);
  });
});
