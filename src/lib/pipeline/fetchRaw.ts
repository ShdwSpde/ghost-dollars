import { writeFile } from "node:fs/promises";

const CAPITAL_URL = "https://data.cityofnewyork.us/resource/fb86-vt7u.json?$limit=50000";
// Dataset yfnk-k7r4 was retired; current Community Districts dataset is 5crt-au7u (verified 2026-06-28).
const GEO_URL = "https://data.cityofnewyork.us/api/geospatial/5crt-au7u?method=export&format=GeoJSON";

async function main() {
  const cap = await fetch(CAPITAL_URL, { headers: { Accept: "application/json" } });
  if (!cap.ok) throw new Error(`capital fetch ${cap.status}`);
  await writeFile("data/raw/capital.json", JSON.stringify(await cap.json(), null, 2));

  const geo = await fetch(GEO_URL);
  if (!geo.ok) throw new Error(`geo fetch ${geo.status}`);
  await writeFile("data/raw/community-districts.geojson", await geo.text());

  console.log("Wrote data/raw/capital.json and community-districts.geojson");
}
main().catch((e) => { console.error(e); process.exit(1); });
