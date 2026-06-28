import type { CdMetric } from "./types";
export function fmtUsd(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n/1e9).toFixed(1)}B`;
  if (a >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(n/1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}
export function fmtPct(n: number | null): string { return n == null ? "—" : `${n.toFixed(1)}%`; }
export function ghostSentence(cd: CdMetric): string {
  const under = cd.ghostDollars > 0;
  return under
    ? `If funded at citywide parity for its population, this district would have received about ${fmtUsd(cd.ghostDollars)} more — it sits below the ${cd.perResidentPercentile}th percentile of per-resident visible capital.`
    : `This district sits above parity (top ${100 - cd.perResidentPercentile}%) — about ${fmtUsd(Math.abs(cd.ghostDollars))} more than an equal-per-resident share.`;
}
