import { writeFile } from "node:fs/promises";

// Capital Projects Dashboard (fb86-vt7u). Each row is one project budget-line in ONE
// reporting period; the dataset republishes ~3x/yr, so the SAME project recurs across
// periods. Summing across periods over-counts ~10x. We pull only the LATEST reporting
// period (the current commitment-plan snapshot) — discovered at fetch time so the
// pipeline stays current — and let the aggregator dedup by fms_id|budget_line.
const BASE = "https://data.cityofnewyork.us/resource/fb86-vt7u.json";
// Dataset yfnk-k7r4 was retired; current Community Districts dataset is 5crt-au7u (verified 2026-06-28).
const GEO_URL = "https://data.cityofnewyork.us/api/geospatial/5crt-au7u?method=export&format=GeoJSON";

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`fetch ${res.status}: ${url}`);
  return res.json();
}

async function main() {
  // 1. Discover the latest reporting period.
  const maxRows = await getJson(`${BASE}?$select=max(reporting_period)`);
  const latest = maxRows[0]?.max_reporting_period;
  if (!latest) throw new Error("could not determine latest reporting_period");

  // 2. Fetch every row for that period (limit comfortably above the ~6k period size).
  const cap = await getJson(`${BASE}?$where=reporting_period='${latest}'&$limit=60000`);
  await writeFile("data/raw/capital.json", JSON.stringify(cap, null, 2));

  const geo = await fetch(GEO_URL);
  if (!geo.ok) throw new Error(`geo fetch ${geo.status}`);
  await writeFile("data/raw/community-districts.geojson", await geo.text());

  console.log(`Wrote ${cap.length} capital rows (period ${latest}) + community-districts.geojson`);
}
main().catch((e) => { console.error(e); process.exit(1); });
