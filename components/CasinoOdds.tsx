"use client";

import { useEffect, useRef, useState } from "react";
import type { CdMetric } from "@/src/lib/types";
import { viceFor, type ViceEntry } from "@/src/lib/viceData";
import { fmtUsd } from "@/src/lib/format";

// ── Reel configuration ────────────────────────────────────────
const CELL_H = 60; // px — height of one reel cell
const SPIN_SYMBOLS = ["◆◆◆", "777", "★★★", "$$$", "♦♦♦"];

// ── Sub-components ────────────────────────────────────────────

interface ReelProps {
  finalLabel: string;
  subLabel: string;
  accentColor: string;
  delay: number; // stagger index (0, 1, 2)
  spinKey: number; // increment to re-spin
  reducedMotion: boolean;
  isProjection: boolean;
}

/**
 * A single vertical reel that scrolls through symbols and lands on finalLabel.
 * Respects prefers-reduced-motion: when true, shows final value immediately.
 */
function Reel({
  finalLabel,
  subLabel,
  accentColor,
  delay,
  spinKey,
  reducedMotion,
  isProjection,
}: ReelProps) {
  const allCells = [...SPIN_SYMBOLS, finalLabel];
  const offset = (allCells.length - 1) * CELL_H;

  // revealed=false → strip at top (translateY 0)
  // revealed=true  → strip at bottom (translateY -offset)
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setRevealed(true);
      return;
    }
    // Jump back to start with no transition, then trigger forward animation.
    setRevealed(false);
    const ms = 80 + delay * 380;
    const t = setTimeout(() => setRevealed(true), ms);
    return () => clearTimeout(t);
  }, [spinKey, reducedMotion, delay]);

  const transitionStyle = revealed && !reducedMotion
    ? `transform ${1.35 + delay * 0.22}s cubic-bezier(0.15, 1, 0.35, 1)`
    : "none";

  return (
    <div className="casino-reel-wrap">
      {/* Reel window: clips to one cell height */}
      <div className="casino-reel-window" aria-hidden="true">
        <div
          className="casino-reel-strip"
          style={{
            transform: revealed ? `translateY(-${offset}px)` : "translateY(0)",
            transition: transitionStyle,
          }}
        >
          {allCells.map((cell, i) => {
            const isLast = i === allCells.length - 1;
            return (
              <div
                key={i}
                className="casino-reel-cell"
                style={{
                  color: isLast ? accentColor : "var(--marigold)",
                  fontSize: isLast ? "0.95rem" : "1.25rem",
                  opacity: isLast ? 1 : 0.7,
                }}
              >
                {cell}
              </div>
            );
          })}
        </div>
      </div>

      {/* Accessible label (always visible) */}
      <div className="casino-reel-value" style={{ color: accentColor }}>
        {finalLabel}
      </div>

      {/* Sub-label below reel */}
      <div className="casino-reel-sub">
        {isProjection && <span className="casino-proj-badge">PROJ&#x200A;</span>}
        {subLabel}
      </div>
    </div>
  );
}

// ── Data builders ─────────────────────────────────────────────

interface ReelDatum {
  finalLabel: string;
  subLabel: string;
  color: string;
}

function buildRealReels(vice: ViceEntry, cd: CdMetric): ReelDatum[] {
  return [
    {
      finalLabel: fmtUsd(vice.wonHereAnnual!),
      subLabel: "WON HERE / YR",
      color: "var(--marigold)",
    },
    {
      finalLabel: fmtUsd(vice.toAlbanyAnnual!),
      subLabel: "→ ALBANY / YR",
      color: "var(--vermilion)",
    },
    {
      finalLabel: fmtUsd(cd.visibleCapital),
      subLabel: "BACK (WHOLE PLAN)",
      color: "var(--cobalt)",
    },
  ];
}

function buildProjectionReels(vice: ViceEntry, cd: CdMetric): ReelDatum[] {
  return [
    {
      finalLabel: fmtUsd(vice.projectedRevenueAnnual!),
      subLabel: "WON / YR",
      color: "var(--marigold)",
    },
    {
      finalLabel: fmtUsd(vice.projectedTaxesAnnual!),
      subLabel: "→ STATE / YR",
      color: "var(--vermilion)",
    },
    {
      finalLabel: fmtUsd(cd.visibleCapital),
      subLabel: "BACK (WHOLE PLAN)",
      color: "var(--cobalt)",
    },
  ];
}

// ── Main component ────────────────────────────────────────────

/**
 * CasinoOdds — "The House Always Wins" slot-machine panel.
 * Self-suppresses (returns null) for non-casino community districts.
 */
export function CasinoOdds({ cd }: { cd: CdMetric }) {
  const vice = viceFor(cd.boroCd);

  const [spinKey, setSpinKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect prefers-reduced-motion on the client.
  // Guard typeof check so jsdom (vitest) does not throw.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Self-suppress for non-casino districts.
  if (!vice) return null;

  const reels = vice.isProjection
    ? buildProjectionReels(vice, cd)
    : buildRealReels(vice, cd);

  // Human-readable asymmetry copy
  const asymmetry = vice.isProjection
    ? buildProjectionAsymmetry(vice, cd)
    : buildRealAsymmetry(vice, cd);

  return (
    <section className="casino-panel" aria-label="The House Always Wins — casino revenue panel">
      {/* Headline */}
      <div className="casino-headline">THE HOUSE ALWAYS WINS</div>

      {/* Projection warning */}
      {vice.isProjection && (
        <div className="casino-proj-notice" role="alert">
          PROJECTED — developer figures, not realized
        </div>
      )}

      {/* Slot machine */}
      <div className="casino-machine" aria-label="Slot machine: gaming revenue vs. local capital">
        <div className="casino-reels">
          {reels.map((reel, i) => (
            <Reel
              key={i}
              finalLabel={reel.finalLabel}
              subLabel={reel.subLabel}
              accentColor={reel.color}
              delay={i}
              spinKey={spinKey}
              reducedMotion={reducedMotion}
              isProjection={vice.isProjection}
            />
          ))}
        </div>

        <button
          className="casino-pull"
          onClick={() => setSpinKey((k) => k + 1)}
          aria-label="Pull lever — replay the slot animation"
        >
          PULL
        </button>
      </div>

      {/* Asymmetry callout */}
      <p className="casino-asymmetry">{asymmetry}</p>

      {/* Honesty footer */}
      <div className="casino-footer">
        {vice.isProjection ? (
          <>
            <strong>⚠ NOT REAL MONEY.</strong> All figures are developer projections from the Metropolitan Park license application (Oct 2025). License was approved December 2025; casino projected to open ~2030. No signed community benefit agreement was publicly available at the time of research.{" "}
            <span className="casino-src">
              Source: QNS, Oct 2025 — qns.com/2025/10/metropolitan-park-supplemental-application/
            </span>
          </>
        ) : (
          <>
            <strong>REAL DATA.</strong> Resorts World NYC net win FY 2024-25: $692.4M (highest-grossing year to date). Education remittance ~$277M is derived at 40% of net win under the Video Lottery Gaming structure in effect through Dec 2025. Cumulative total to state education fund is a $4.75B midpoint of $4.5B–$5B range from RWNYC press releases. Resorts World received a full commercial casino license December 2025 — future contributions will differ.{" "}
            <span className="casino-src">
              Source: CasinoReports.com · QNS (Aug 2023) · RWNYC press releases
            </span>
          </>
        )}
      </div>
    </section>
  );
}

// ── Asymmetry text builders ────────────────────────────────────

function buildRealAsymmetry(vice: ViceEntry, cd: CdMetric): string {
  return (
    "The casino remits an estimated " +
    fmtUsd(vice.toAlbanyAnnual!) +
    " to Albany every single year — and has sent an estimated " +
    fmtUsd(vice.cumulativeToState!) +
    " to the state since 2011. The entire capital plan for this district — everything it received over the full plan window — is " +
    fmtUsd(cd.visibleCapital) +
    ". Those education dollars flow statewide through a formula, not back to South Ozone Park."
  );
}

function buildProjectionAsymmetry(vice: ViceEntry, cd: CdMetric): string {
  return (
    "If projections hold, the casino would remit an estimated " +
    fmtUsd(vice.projectedTaxesAnnual!) +
    " to New York State every year. This district’s entire capital plan totals " +
    fmtUsd(cd.visibleCapital) +
    ". The developer’s community benefit pledge—" +
    fmtUsd(vice.communityPledge!) +
    "—is a one-time, non-annual commitment. The annual tax flow goes to the state, not to Flushing."
  );
}
