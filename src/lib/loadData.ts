import type { CdMetric, Dataset } from "./types";
export type MetricKey = "actual" | "perResident" | "ghost";
export type OverlayKey = "none" | "medianHhIncome" | "pctBipoc" | "povertyRate";

export function getMetricValue(cd: CdMetric, metric: MetricKey): number {
  if (metric === "actual") return cd.visibleCapital;
  if (metric === "perResident") return cd.perResidentCapital;
  return cd.ghostDollars;
}
export async function loadDataset(): Promise<Dataset> {
  const res = await fetch("/data/cd-metrics.json");
  return res.json();
}
