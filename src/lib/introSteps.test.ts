import { describe, it, expect } from "vitest";
import { INTRO_STEPS } from "./introSteps";
describe("INTRO_STEPS", () => {
  it("walks the Queens corridor in order", () => {
    expect(INTRO_STEPS.map((s)=>s.boroCd)).toEqual(["404","403","407","412","410"]);
  });
  it("each step names a metric and copy", () => {
    for (const s of INTRO_STEPS) { expect(s.headline.length).toBeGreaterThan(0); expect(["actual","perResident","ghost"]).toContain(s.metric); }
  });
});
