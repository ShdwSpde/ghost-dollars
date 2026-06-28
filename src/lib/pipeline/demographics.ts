import { normalizeCdId } from "./cdId";

export interface Demographics {
  boroCd: string;
  population: number;
  medianHhIncome: number | null;
  pctBipoc: number | null;
  povertyRate: number | null;
}

const num = (s: string): number | null => {
  const t = s?.trim();
  if (!t) return null;
  const n = Number(t.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export function parseDemographicsCsv(csv: string): Map<string, Demographics> {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(",").map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const out = new Map<string, Demographics>();
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const boroCd = normalizeCdId(cells[idx("boro_cd")]);
    if (!boroCd) continue;
    out.set(boroCd, {
      boroCd,
      population: num(cells[idx("population")]) ?? 0,
      medianHhIncome: num(cells[idx("median_hh_income")]),
      pctBipoc: num(cells[idx("pct_bipoc")]),
      povertyRate: num(cells[idx("poverty_rate")]),
    });
  }
  return out;
}
