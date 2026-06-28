"use client";
import { useAtlas } from "./AtlasProvider";
import type { MetricKey, OverlayKey } from "@/src/lib/loadData";

const METRICS: [MetricKey, string][] = [
  ["actual", "Actual $"],
  ["perResident", "Per-resident $"],
  ["ghost", "Ghost $"],
];
const OVERLAYS: [OverlayKey, string][] = [
  ["none", "No overlay"],
  ["medianHhIncome", "Median income"],
  ["pctBipoc", "% BIPOC"],
  ["povertyRate", "Poverty rate"],
];

export function MetricToggle() {
  const { metric, setMetric, overlay, setOverlay } = useAtlas();
  return (
    <div className="toggle-bar">
      <div role="radiogroup" aria-label="Metric">
        {METRICS.map(([k, l]) => (
          <button key={k} aria-pressed={metric === k} onClick={() => setMetric(k)}>
            {l}
          </button>
        ))}
      </div>
      <select
        aria-label="Demographic overlay"
        value={overlay}
        onChange={(e) => setOverlay(e.target.value as OverlayKey)}
      >
        {OVERLAYS.map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
