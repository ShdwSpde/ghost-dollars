"use client";

import { useRef } from "react";
import { toPng } from "html-to-image";
import type { CdMetric } from "@/src/lib/types";
import { BOROUGH_BY_DIGIT, cdNumber } from "@/src/lib/pipeline/cdId";
import { fmtUsd, fmtPct, ordinal } from "@/src/lib/format";
import { neighborhoodImage } from "@/src/lib/neighborhoodImages";
import { viceFor } from "@/src/lib/viceData";
import { referenceNote } from "@/src/lib/referenceDistricts";

// NYC has 59 community districts
const TOTAL_CDS = 59;

// Design dimensions (fixed canvas)
const CARD_W = 640;
const CARD_H = 900;
// On-screen scale: fit a ~340px sidebar column
const CARD_SCALE = 340 / CARD_W;

/** Derive a display name for the district in priority order */
function neighborhoodName(cd: CdMetric): string {
  if (cd.corridorNote) return cd.corridorNote;
  const ref = referenceNote(cd.boroCd);
  if (ref) {
    // "Washington Heights — Dominican uptown" → "Washington Heights"
    return ref.split("—")[0].trim();
  }
  const boro = BOROUGH_BY_DIGIT[cd.boroCd[0]];
  const n = cdNumber(cd.boroCd);
  return `${boro} CD${n}`;
}

function cardSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Mini ghost-bar (card-internal variant) ────────────────────────────
function MiniGhostBar({
  visible,
  expected,
  ghost,
}: {
  visible: number;
  expected: number;
  ghost: number;
}) {
  const aboveParity = ghost <= 0;
  if (aboveParity) {
    return (
      <div className="tcard-bar-track" role="img" aria-label="Above parity — full bar received">
        <div className="tcard-bar-fill" style={{ flex: 1 }} />
        <div className="tcard-bar-over" />
      </div>
    );
  }
  const cobaltPct = Math.max(2, Math.min(100, (visible / expected) * 100));
  const gapPct = Math.max(0, 100 - cobaltPct);
  return (
    <div
      className="tcard-bar-track"
      role="img"
      aria-label={`Received ${fmtUsd(visible)} of the ${fmtUsd(expected)} expected at parity — ${fmtUsd(ghost)} ghost.`}
    >
      <div className="tcard-bar-fill" style={{ width: `${cobaltPct}%` }} />
      <div className="tcard-bar-gap" style={{ width: `${gapPct}%` }} />
    </div>
  );
}

// ── Main TradingCard component ─────────────────────────────────────────
export function TradingCard({ cd }: { cd: CdMetric }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const photo = neighborhoodImage(cd.boroCd);
  const vice = viceFor(cd.boroCd);
  const refNote = referenceNote(cd.boroCd);
  const name = neighborhoodName(cd);
  const boro = BOROUGH_BY_DIGIT[cd.boroCd[0]];
  const cdNum = cdNumber(cd.boroCd);
  const isGhost = cd.ghostDollars > 0;

  async function handleExport() {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        width: CARD_W,
        height: CARD_H,
        // Remove the CSS-transform scale so export captures full design size
        style: { transform: "none", transformOrigin: "top left" },
      });
      const slug = cardSlug(name);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `ghost-dollars-CD${cd.boroCd}-${slug}.png`;
      a.click();
    } catch (err) {
      console.error("[TradingCard] export failed:", err);
    }
  }

  return (
    <div className="tcard-wrapper">
      {/* Scale box: constrains the visual footprint on screen */}
      <div
        className="tcard-scale-box"
        style={{
          width: Math.round(CARD_W * CARD_SCALE),
          height: Math.round(CARD_H * CARD_SCALE),
        }}
      >
        {/* The actual design-size card; CSS-scaled for on-screen display */}
        <div
          ref={cardRef}
          className="tcard"
          style={{
            width: CARD_W,
            height: CARD_H,
            transform: `scale(${CARD_SCALE})`,
            transformOrigin: "top left",
          }}
          aria-label={`Ghost Dollars trading card for ${name}`}
        >
          {/* ── PHOTO BAND ─────────────────────────────────────── */}
          <div className="tcard-photo-band">
            {photo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.alt} className="tcard-photo-img" />
                <div className="tcard-photo-wash" aria-hidden="true" />
                <div className="tcard-photo-credit" aria-hidden="true">
                  {photo.credit} · {photo.license}
                </div>
              </>
            ) : (
              <div className="tcard-photo-fallback" aria-hidden="true" />
            )}
          </div>

          {/* ── CONTENT AREA ────────────────────────────────────── */}
          <div className="tcard-body">
            {/* Header row */}
            <div className="tcard-header-row">
              <span className="tcard-wordmark">GHOST DOLLARS</span>
              <span className="tcard-card-id">
                {boro.toUpperCase()} · CD{cdNum}
                <span className="tcard-collect-num"> · {cd.boroCd} / {TOTAL_CDS}</span>
              </span>
            </div>

            {/* District name */}
            <h3 className="tcard-name">{name.toUpperCase()}</h3>

            {/* Hero stat + rank badge */}
            <div className="tcard-hero-row">
              <div className={`tcard-hero-stat ${isGhost ? "tcard-is-ghost" : "tcard-is-above"}`}>
                {isGhost ? (
                  <>
                    <span className="tcard-hero-amount">{fmtUsd(cd.ghostDollars)}</span>
                    <span className="tcard-hero-label"> GHOST</span>
                  </>
                ) : (
                  <span className="tcard-hero-label">ABOVE PARITY</span>
                )}
              </div>
              <div className="tcard-rank-badge" aria-label={`${ordinal(cd.perResidentPercentile)} percentile`}>
                <span className="tcard-rank-num">{ordinal(cd.perResidentPercentile)}</span>
                <span className="tcard-rank-label">PERCENTILE</span>
              </div>
            </div>

            {/* Stat strip */}
            <div className="tcard-stats" role="list" aria-label="District statistics">
              <div className="tcard-stat-row" role="listitem">
                <span className="tcard-stat-label">Visible capital</span>
                <span className="tcard-stat-dots" aria-hidden="true" />
                <span className="tcard-stat-val">{fmtUsd(cd.visibleCapital)}</span>
              </div>
              <div className="tcard-stat-row" role="listitem">
                <span className="tcard-stat-label">Expected at parity</span>
                <span className="tcard-stat-dots" aria-hidden="true" />
                <span className="tcard-stat-val">{fmtUsd(cd.expectedCapital)}</span>
              </div>
              <div className="tcard-stat-row" role="listitem">
                <span className="tcard-stat-label">Population</span>
                <span className="tcard-stat-dots" aria-hidden="true" />
                <span className="tcard-stat-val">{cd.population.toLocaleString()}</span>
              </div>
              <div className="tcard-stat-row" role="listitem">
                <span className="tcard-stat-label">Median income</span>
                <span className="tcard-stat-dots" aria-hidden="true" />
                <span className="tcard-stat-val">{cd.medianHhIncome != null ? fmtUsd(cd.medianHhIncome) : "—"}</span>
              </div>
              <div className="tcard-stat-row" role="listitem">
                <span className="tcard-stat-label">% BIPOC</span>
                <span className="tcard-stat-dots" aria-hidden="true" />
                <span className="tcard-stat-val">{fmtPct(cd.pctBipoc)}</span>
              </div>
            </div>

            {/* Mini ghost-bar */}
            <div className="tcard-bar-section">
              <div className="tcard-bar-legend">
                Capital received vs equal-per-resident parity
              </div>
              <MiniGhostBar
                visible={cd.visibleCapital}
                expected={cd.expectedCapital}
                ghost={cd.ghostDollars}
              />
              <div className="tcard-bar-caption">
                <span>■ Received</span>
                {isGhost ? (
                  <span>▢ Gap ({fmtUsd(cd.ghostDollars)})</span>
                ) : (
                  <span>↑ Above parity</span>
                )}
                <span>Parity {fmtUsd(cd.expectedCapital)}</span>
              </div>
            </div>

            {/* Flags */}
            {(vice || cd.corridorNote || refNote) && (
              <div className="tcard-flags" aria-label="District flags">
                {vice && (
                  <span className="tcard-flag tcard-flag-casino">
                    🎰 CASINO HOST
                  </span>
                )}
                {cd.corridorNote && (
                  <span className="tcard-flag tcard-flag-corridor">
                    QUEENS CORRIDOR
                  </span>
                )}
                {refNote && !cd.corridorNote && (
                  <span className="tcard-flag tcard-flag-ref">
                    CITYWIDE REFERENCE
                  </span>
                )}
              </div>
            )}

            {/* Footer micro */}
            <div className="tcard-footer">
              ghost-dollars.vercel.app · ghost dollars = visible capital vs an equal-per-resident parity baseline · illustrative
            </div>
          </div>
        </div>
      </div>

      {/* Export button — lives OUTSIDE the card so it isn't captured */}
      <button
        className="tcard-export-btn"
        onClick={handleExport}
        aria-label={`Download Ghost Dollars trading card for ${name} as PNG`}
      >
        ⬇ Export card
      </button>
    </div>
  );
}
