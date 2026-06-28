/**
 * One-off script: generates data/raw/demographics.csv as a placeholder.
 * Uses deterministic values seeded from boro_cd numeric value.
 * DO NOT run in production — real ACS 2019-2023 data replaces this file before any production deploy.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { normalizeCdId, isPlaceable } from "../../src/lib/pipeline/cdId";

// Story-plausible overrides for the five Queens corridor CDs.
const STORY_CDS: Record<string, { population: number; median_hh_income: number; pct_bipoc: number; poverty_rate: number }> = {
  "303": { population: 171000, median_hh_income: 58000, pct_bipoc: 88, poverty_rate: 17 },
  "404": { population: 152000, median_hh_income: 55000, pct_bipoc: 90, poverty_rate: 19 },
  "407": { population: 245000, median_hh_income: 60000, pct_bipoc: 70, poverty_rate: 14 },
  "410": { population: 122000, median_hh_income: 72000, pct_bipoc: 80, poverty_rate: 12 },
  "412": { population: 226000, median_hh_income: 67000, pct_bipoc: 93, poverty_rate: 15 },
};

const geo = JSON.parse(readFileSync("data/raw/community-districts.geojson", "utf8"));

const placeableCds: string[] = [];
for (const feature of geo.features) {
  const raw = feature.properties?.boro_cd;
  const cd = normalizeCdId(raw);
  if (cd && isPlaceable(cd) && !placeableCds.includes(cd)) {
    placeableCds.push(cd);
  }
}
placeableCds.sort();

console.log(`Placeable CDs: ${placeableCds.length}`);

// Deterministic pseudo-random using fmix32 hash for good distribution with nearby seeds.
function fmix32(h: number): number {
  h ^= h >>> 16;
  h = (Math.imul(h, 0x85ebca6b)) | 0;
  h ^= h >>> 13;
  h = (Math.imul(h, 0xc2b2ae35)) | 0;
  h ^= h >>> 16;
  return h;
}

function deterministicValue(seed: number, min: number, max: number): number {
  const hashed = fmix32(seed) >>> 0;
  const t = hashed / 0xffffffff;
  return Math.round(min + t * (max - min));
}

const rows: string[] = ["boro_cd,population,median_hh_income,pct_bipoc,poverty_rate"];

for (const cd of placeableCds) {
  if (STORY_CDS[cd]) {
    const s = STORY_CDS[cd];
    rows.push(`${cd},${s.population},${s.median_hh_income},${s.pct_bipoc},${s.poverty_rate}`);
  } else {
    const seed = parseInt(cd, 10);
    const population = deterministicValue(seed, 50000, 250000);
    const median_hh_income = deterministicValue(seed + 1, 35000, 120000);
    const pct_bipoc = deterministicValue(seed + 2, 0, 100);
    const poverty_rate = deterministicValue(seed + 3, 0, 40);
    rows.push(`${cd},${population},${median_hh_income},${pct_bipoc},${poverty_rate}`);
  }
}

writeFileSync("data/raw/demographics.csv", rows.join("\n") + "\n");
console.log(`Wrote data/raw/demographics.csv (${rows.length - 1} rows)`);
