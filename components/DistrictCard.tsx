"use client";
import { useAtlas } from "./AtlasProvider";
import { BOROUGH_BY_DIGIT } from "@/src/lib/pipeline/cdId";
import { fmtUsd, fmtPct, ghostSentence, ordinal } from "@/src/lib/format";

export function DistrictCard() {
  const { dataset, selectedCd, setSelectedCd } = useAtlas();
  if (!selectedCd) return <aside className="card empty">Click a district to see what it lost.</aside>;
  const cd = dataset.cds.find((c) => c.boroCd === selectedCd);
  if (!cd) return <aside className="card empty">No data for this district.</aside>;
  return (
    <aside className="card" aria-live="polite">
      <button className="close" onClick={()=>setSelectedCd(null)} aria-label="Close">×</button>
      <h2>{BOROUGH_BY_DIGIT[cd.boroCd[0]]} CD{parseInt(cd.boroCd.slice(1),10)}</h2>
      {cd.corridorNote && <p className="corridor">{cd.corridorNote}</p>}
      <dl>
        <div><dt>Visible capital</dt><dd>{fmtUsd(cd.visibleCapital)}</dd></div>
        <div><dt>Expected at parity</dt><dd>{fmtUsd(cd.expectedCapital)}</dd></div>
        <div><dt>Ghost dollars</dt><dd>{fmtUsd(cd.ghostDollars)}</dd></div>
        <div><dt>Per-resident rank</dt><dd>{ordinal(cd.perResidentPercentile)} pct</dd></div>
        <div><dt>Population</dt><dd>{cd.population.toLocaleString()}</dd></div>
        <div><dt>Median income</dt><dd>{cd.medianHhIncome ? fmtUsd(cd.medianHhIncome) : "—"}</dd></div>
        <div><dt>% BIPOC</dt><dd>{fmtPct(cd.pctBipoc)}</dd></div>
      </dl>
      <p className="ghost-sentence">{ghostSentence(cd)}</p>
    </aside>
  );
}
