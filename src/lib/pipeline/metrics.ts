import type { Demographics } from "./demographics";
import type { CapitalAggregate } from "./capital";
import type { CdMetric, Dataset } from "../types";

export const CORRIDOR_NOTES: Record<string, string> = {
  "303": "Jackson Heights / North Corona",
  "404": "Elmhurst / Corona",
  "407": "Flushing / Willets Point — proposed Metropolitan Park casino",
  "410": "South Ozone Park / Howard Beach — Resorts World + Aqueduct",
  "412": "Jamaica / St. Albans / Hollis",
};

export function buildMetrics(demo: Map<string, Demographics>, agg: CapitalAggregate): Dataset {
  const placeable = [...demo.values()].filter((d) => d.population > 0);
  const totalPop = placeable.reduce((s, d) => s + d.population, 0);
  const totalVisiblePlaceable = placeable.reduce((s, d) => s + (agg.visibleByCd.get(d.boroCd) ?? 0), 0);
  const parityPerResident = totalPop > 0 ? totalVisiblePlaceable / totalPop : 0;

  // Per-resident values first, to rank into percentiles.
  const withPerResident = placeable.map((d) => {
    const visibleCapital = agg.visibleByCd.get(d.boroCd) ?? 0;
    return { d, visibleCapital, perResidentCapital: visibleCapital / d.population };
  });
  const sorted = [...withPerResident].sort((a, b) => a.perResidentCapital - b.perResidentCapital);
  const n = sorted.length;
  const percentileByCd = new Map<string, number>();
  sorted.forEach((row, i) => {
    percentileByCd.set(row.d.boroCd, n > 1 ? Math.round((i / (n - 1)) * 100) : 100);
  });

  const cds: CdMetric[] = withPerResident.map(({ d, visibleCapital, perResidentCapital }) => {
    const expectedCapital = parityPerResident * d.population;
    return {
      boroCd: d.boroCd,
      population: d.population,
      medianHhIncome: d.medianHhIncome,
      pctBipoc: d.pctBipoc,
      povertyRate: d.povertyRate,
      visibleCapital,
      perResidentCapital,
      expectedCapital,
      ghostDollars: expectedCapital - visibleCapital,
      perResidentPercentile: percentileByCd.get(d.boroCd) ?? 0,
      inCorridor: d.boroCd in CORRIDOR_NOTES,
      corridorNote: CORRIDOR_NOTES[d.boroCd],
    };
  });

  const totalCapital = agg.totalVisible + agg.totalDark;
  return {
    meta: {
      capitalWindow: "Total project budget, current Capital Projects Dashboard",
      totalVisibleCapital: agg.totalVisible,
      totalDarkCapital: agg.totalDark,
      darkSharePct: totalCapital > 0 ? (agg.totalDark / totalCapital) * 100 : 0,
      parityPerResident,
      acsVintage: "2019–2023",
    },
    cds,
  };
}
