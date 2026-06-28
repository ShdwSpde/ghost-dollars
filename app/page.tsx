import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Dataset } from "@/src/lib/types";
import { AtlasProvider } from "@/components/AtlasProvider";
import { MapPanel } from "@/components/MapPanel";
import { MetricToggle } from "@/components/MetricToggle";
import { PatternPanel } from "@/components/PatternPanel";
import { DistrictCard } from "@/components/DistrictCard";
import { DarkDollarsBanner } from "@/components/DarkDollarsBanner";
import { HomeSearch } from "@/components/HomeSearch";
import { IntroScroll } from "@/components/IntroScroll";

export default async function Page() {
  const dataset: Dataset = JSON.parse(await readFile(join(process.cwd(), "public/data/cd-metrics.json"), "utf8"));
  return (
    <AtlasProvider dataset={dataset}>
      <main className="atlas">
        <header><h1>Ghost Dollars</h1><HomeSearch /></header>
        <IntroScroll />
        <DarkDollarsBanner />
        <section className="stage">
          <div className="map-wrap"><MetricToggle /><MapPanel /></div>
          <div className="side"><PatternPanel /><DistrictCard /></div>
        </section>
      </main>
    </AtlasProvider>
  );
}
