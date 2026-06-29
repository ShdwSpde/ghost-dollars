"use client";
import { useAtlas } from "./AtlasProvider";
import { BOROUGH_BY_DIGIT } from "@/src/lib/pipeline/cdId";
import { fmtUsd, fmtPct, ghostSentence, ordinal } from "@/src/lib/format";
import { referenceNote } from "@/src/lib/referenceDistricts";
import { neighborhoodImage } from "@/src/lib/neighborhoodImages";
import { Receipt } from "./Receipt";
import { CasinoOdds } from "./CasinoOdds";

// The signature device: ghost dollars drawn as visible negative space.
// Solid cobalt = capital received; hollow vermilion-outlined extension = the
// parity gap the district did NOT get. Above parity = full cobalt + marigold tick.
function GhostBar({ visible, expected, ghost }: { visible: number; expected: number; ghost: number }) {
  const aboveParity = ghost <= 0;
  if (aboveParity) {
    return (
      <div className="ghostbar">
        <p className="ghostbar-legend">Capital received vs equal-per-resident parity</p>
        <div
          className="ghostbar-track"
          role="img"
          aria-label={`Received ${fmtUsd(visible)}, above the ${fmtUsd(expected)} equal-per-resident parity share.`}
        >
          <div className="ghostbar-fill" style={{ flex: 1 }}>
            <span className="ghostbar-num">{fmtUsd(visible)}</span>
          </div>
          <div className="ghostbar-over" title="Above parity" />
        </div>
        <div className="ghostbar-caption">
          <span>Received (above parity)</span>
          <span>Parity {fmtUsd(expected)}</span>
        </div>
      </div>
    );
  }
  const cobaltPct = Math.max(2, Math.min(100, (visible / expected) * 100));
  const gapPct = Math.max(0, 100 - cobaltPct);
  return (
    <div className="ghostbar">
      <p className="ghostbar-legend">What it got vs what parity owes</p>
      <div
        className="ghostbar-track"
        role="img"
        aria-label={`Received ${fmtUsd(visible)} of the ${fmtUsd(expected)} expected at parity — ${fmtUsd(ghost)} missing.`}
      >
        <div className="ghostbar-fill" style={{ width: `${cobaltPct}%` }}>
          {cobaltPct > 30 && <span className="ghostbar-num">{fmtUsd(visible)}</span>}
        </div>
        <div className="ghostbar-gap" style={{ width: `${gapPct}%` }}>
          <span className="ghostbar-num">{fmtUsd(ghost)} missing</span>
        </div>
      </div>
      <div className="ghostbar-caption">
        <span>■ Received</span>
        <span>▢ Ghost dollars (the gap)</span>
        <span>Parity {fmtUsd(expected)}</span>
      </div>
    </div>
  );
}

export function DistrictCard() {
  const { dataset, selectedCd, setSelectedCd } = useAtlas();
  if (!selectedCd) return <aside className="card empty">Click a district to see what it lost.</aside>;
  const cd = dataset.cds.find((c) => c.boroCd === selectedCd);
  if (!cd) return <aside className="card empty">No data for this district.</aside>;
  const photo = neighborhoodImage(cd.boroCd);
  return (
    <aside className="card" aria-live="polite">
      {photo && (
        <div className="duotone-card" role="presentation">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt={photo.alt}
            loading="eager"
            decoding="async"
          />
        </div>
      )}
      <button className="close" onClick={()=>setSelectedCd(null)} aria-label="Close">×</button>
      <h2>{BOROUGH_BY_DIGIT[cd.boroCd[0]]} CD{parseInt(cd.boroCd.slice(1),10)}</h2>
      {cd.corridorNote && <p className="corridor">{cd.corridorNote}</p>}
      {!cd.corridorNote && referenceNote(cd.boroCd) && (
        <div className="reference-note">
          <span className="reference-note-eyebrow">Citywide Reference</span>
          <span className="reference-note-text">{referenceNote(cd.boroCd)}</span>
        </div>
      )}
      <GhostBar visible={cd.visibleCapital} expected={cd.expectedCapital} ghost={cd.ghostDollars} />
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
      <Receipt cd={cd} />
      <CasinoOdds cd={cd} />
    </aside>
  );
}
