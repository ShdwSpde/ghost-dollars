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
import { Hero } from "@/components/Hero";
import { ALL_NEIGHBORHOOD_IMAGES } from "@/src/lib/neighborhoodImages";

export default async function Page() {
  const dataset: Dataset = JSON.parse(await readFile(join(process.cwd(), "public/data/cd-metrics.json"), "utf8"));
  return (
    <AtlasProvider dataset={dataset}>
      <main className="atlas">
        <header>
          <h1>Ghost Dollars</h1>
          <HomeSearch />
        </header>

        <Hero meta={dataset.meta} />

        <IntroScroll />

        <DarkDollarsBanner />

        <section className="explorer" aria-label="District explorer">
          <h2 className="explorer-head">Explore every district</h2>
          <p className="explorer-lede">
            Switch the metric, drop in a demographic overlay, and click any
            community district to see what it got — and what parity says it
            should have.
          </p>
          <div className="stage">
            <div className="map-wrap">
              <MetricToggle />
              <div className="map-frame">
                <MapPanel />
              </div>
            </div>
            <div className="side">
              <PatternPanel />
              <DistrictCard />
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="footer-inner">
            <span className="preview">Preview</span>
            <h3>Sources &amp; method</h3>
            <p>
              Capital figures: NYC Capital Projects Dashboard and the NYC
              Comptroller&rsquo;s &ldquo;Flying Blind on Billions&rdquo; (Dec 2025).
              Demographics: American Community Survey 5-year, 2019&ndash;2023.
              District boundaries: NYC Department of City Planning.
            </p>
            <p>
              Method: &ldquo;Ghost dollars&rdquo; are a district&rsquo;s visible capital
              measured against an equal-per-resident parity baseline. Demographic
              attributes are approximated from PUMA-to-community-district crosswalks,
              so neighborhood figures are estimates, not exact counts.
            </p>
            <p>
              This is a preview built on partial, published data — it surfaces a
              pattern, not a precise ledger.
            </p>

            <h3>Photo credits</h3>
            <p style={{ fontSize: "0.82rem", lineHeight: 1.7, maxWidth: "70ch" }}>
              Neighborhood photography sourced from{" "}
              <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener noreferrer">
                Wikimedia Commons
              </a>
              {" "}under Creative Commons and Public Domain licenses.
            </p>
            <ul style={{ fontSize: "0.78rem", lineHeight: 1.7, listStyle: "none", maxWidth: "70ch" }}>
              {Object.entries(ALL_NEIGHBORHOOD_IMAGES).map(([boroCd, img]) => (
                <li key={boroCd} style={{ borderTop: "1px solid rgba(243,233,211,0.15)", paddingTop: "0.2rem" }}>
                  <strong style={{ color: "var(--marigold)" }}>CD{boroCd}:</strong>{" "}
                  <a href={img.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {img.credit}
                  </a>
                  {" "}— {img.license}
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </main>
    </AtlasProvider>
  );
}
