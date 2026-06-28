import { readFile, writeFile } from "node:fs/promises";
import { parseDemographicsCsv } from "./demographics";
import { aggregateCapital, type CapitalRecord } from "./capital";
import { buildMetrics } from "./metrics";
import { normalizeCdId } from "./cdId";

async function main() {
  const capital = JSON.parse(await readFile("data/raw/capital.json", "utf8")) as CapitalRecord[];
  const demo = parseDemographicsCsv(await readFile("data/raw/demographics.csv", "utf8"));
  const geo = JSON.parse(await readFile("data/raw/community-districts.geojson", "utf8"));

  const dataset = buildMetrics(demo, aggregateCapital(capital));

  // Normalize a stable join key onto every geometry feature.
  // The dataset from 5crt-au7u uses "boro_cd" as the property name.
  for (const f of geo.features) {
    const p = f.properties ?? {};
    p.boroCd = normalizeCdId(p.boro_cd ?? p.BoroCD ?? p.borocd);
    f.properties = p;
  }

  await writeFile("public/data/cd-metrics.json", JSON.stringify(dataset, null, 2));
  await writeFile("public/data/community-districts.geojson", JSON.stringify(geo));
  console.log(`Wrote ${dataset.cds.length} CDs. Dark share: ${dataset.meta.darkSharePct.toFixed(1)}%`);
}
main().catch((e) => { console.error(e); process.exit(1); });
