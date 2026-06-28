import type { MetricKey } from "./loadData";

// Ghost = absence → a "missing/negative space" ramp (pale to deep magenta-red).
// Actual/perResident = presence → pale to deep teal.
const RAMPS: Record<MetricKey, string[]> = {
  ghost: ["#f3e9ee", "#d98aa9", "#b03a6e", "#7a1f48"],
  actual: ["#e8f2f1", "#8fc9c4", "#3f9690", "#1d5f5b"],
  perResident: ["#e8f2f1", "#8fc9c4", "#3f9690", "#1d5f5b"],
};

export function colorForValue(value: number, min: number, max: number, metric: MetricKey): string {
  const ramp = RAMPS[metric];
  const t = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  const idx = Math.min(ramp.length - 1, Math.floor(t * (ramp.length - 1)));
  return ramp[idx];
}
