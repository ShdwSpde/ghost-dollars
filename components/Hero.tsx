import type { DatasetMeta } from "@/src/lib/types";
import { fmtUsd } from "@/src/lib/format";
import { CountUp } from "@/components/CountUp";

export function Hero({ meta }: { meta: DatasetMeta }) {
  const cents = Math.round(meta.darkSharePct);
  const darkLabel = fmtUsd(meta.totalDarkCapital); // e.g. "$116.3B"
  return (
    <section className="hero" aria-labelledby="hero-thesis">
      <div className="hero-blocks" aria-hidden="true">
        <span className="b1" />
        <span className="b2" />
        <span className="b3" />
      </div>
      <div className="hero-inner">
        <p className="hero-eyebrow">Ghost Dollars · An NYC capital-equity map</p>
        <h2 id="hero-thesis">
          <span className="hl">{cents}¢</span> of every capital dollar the city
          publishes can&rsquo;t be placed on a map.
        </h2>
        {/*
         * aria-label exposes the final value immediately to assistive tech;
         * the CountUp child is aria-hidden so AT skips the intermediate frames.
         */}
        <p className="hero-stat mono" aria-label={`${darkLabel} unplaceable`}>
          <CountUp target={meta.totalDarkCapital} finalLabel={darkLabel} />
          {" "}unplaceable
        </p>
        <p className="hero-sub">
          The money that names a neighborhood skips working-class, immigrant
          Queens — Jackson Heights, Corona, Flushing, Jamaica, South Ozone Park.
          This map makes the missing visible.
        </p>
        <p className="scroll-cue">Scroll the corridor</p>
      </div>
    </section>
  );
}
