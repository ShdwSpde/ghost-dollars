import type { CdMetric } from "./types";
export function fmtUsd(n: number): string {
  if (n < 0) return "-" + fmtUsd(-n);
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n/1e9).toFixed(1)}B`;
  if (a >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(n/1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}
export function fmtPct(n: number | null): string { return n == null ? "—" : `${n.toFixed(1)}%`; }
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
export function ghostSentence(cd: CdMetric): string {
  return cd.ghostDollars > 0
    ? `This district received about ${fmtUsd(cd.ghostDollars)} below an equal-per-resident share — it ranks at the ${ordinal(cd.perResidentPercentile)} percentile of per-resident visible capital citywide.`
    : `This district sits above parity — about ${fmtUsd(Math.abs(cd.ghostDollars))} more than an equal-per-resident share (${ordinal(100 - cd.perResidentPercentile)} from the top).`;
}
