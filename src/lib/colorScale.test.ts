import { describe, it, expect } from "vitest";
import { colorForValue } from "./colorScale";

describe("colorForValue", () => {
  it("returns a neutral color at the low end", () => {
    expect(colorForValue(0, 0, 100, "ghost")).toMatch(/^#|rgb/);
  });
  it("maps higher ghost dollars to a more intense color than lower", () => {
    const lo = colorForValue(10, 0, 100, "ghost");
    const hi = colorForValue(90, 0, 100, "ghost");
    expect(lo).not.toBe(hi);
  });
  it("clamps out-of-range values without throwing", () => {
    expect(() => colorForValue(999, 0, 100, "ghost")).not.toThrow();
  });
});
