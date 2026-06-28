import { describe, it, expect } from "vitest";
import { fmtUsd, fmtPct, ghostSentence, ordinal } from "./format";

describe("formatters", () => {
  it("formats USD compactly", () => { expect(fmtUsd(1500000)).toBe("$1.5M"); expect(fmtUsd(2300)).toBe("$2.3K"); });
  it("formats percent or dash", () => { expect(fmtPct(15.1)).toBe("15.1%"); expect(fmtPct(null)).toBe("—"); });
  it("writes an under-parity sentence", () => {
    const s = ghostSentence({ boroCd:"412", ghostDollars: 5_000_000, perResidentPercentile: 8, population: 225919 } as any);
    expect(s).toContain("below");
    expect(s).toContain("8");
  });
  it("writes an over-parity sentence when ghost is negative", () => {
    const s = ghostSentence({ boroCd:"301", ghostDollars: -2_000_000, perResidentPercentile: 88, population: 100000 } as any);
    expect(s).toContain("above");
  });
  it("formats negative USD correctly", () => {
    expect(fmtUsd(-2_000_000)).toBe("-$2.0M");
  });
  it("ordinal suffixes", () => {
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(3)).toBe("3rd");
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(21)).toBe("21st");
    expect(ordinal(8)).toBe("8th");
  });
});
