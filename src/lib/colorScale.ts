import type { MetricKey } from "./loadData";

// Mamdani-campaign poster ramps on the warm cream ground.
// Ghost = deficit/loss → cream → marigold → vermilion → deep oxblood.
// Actual/perResident = presence/funded → cream → light blue → cobalt → deep navy.
const RAMPS: Record<MetricKey, string[]> = {
  ghost: ["#F3E9D3", "#F7B21B", "#EA3B22", "#8E1B12"],
  actual: ["#F3E9D3", "#9FB3E8", "#1E2C8C", "#121A57"],
  perResident: ["#F3E9D3", "#9FB3E8", "#1E2C8C", "#121A57"],
};

export function colorForValue(value: number, min: number, max: number, metric: MetricKey): string {
  const ramp = RAMPS[metric];
  const t = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  const idx = Math.min(ramp.length - 1, Math.floor(t * (ramp.length - 1)));
  return ramp[idx];
}
