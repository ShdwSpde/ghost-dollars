/**
 * viceData.ts — Gaming / casino revenue data for NYC casino-adjacent districts.
 *
 * CD 410 (South Ozone Park): REAL DATA — Resorts World NYC (VGM era, FY 2024-25)
 *   Net win: $692.4M — CasinoReports.com, "Can Resorts World Hit Its Ambitious New York Revenue Target?"
 *   https://www.casinoreports.com/resorts-world-billions-revenue-targets/
 *   Education remittance: ~$277M derived at 40% of net win under VGM tax structure (same source)
 *   Cumulative: midpoint of $4.5B–$5B range from QNS / RWNYC press releases
 *   https://qns.com/2023/08/resorts-world-passes-revenue-new-york-public-schools/
 *
 * CD 407 (Flushing / Willets Point): DEVELOPER PROJECTIONS — Metropolitan Park license application, Oct 2025
 *   All figures from the license application; NOT realized revenue.
 *   Source: QNS, "Metropolitan Park submits supplemental application, forecasts $33B in tax revenue over 30 years"
 *   https://qns.com/2025/10/metropolitan-park-supplemental-application/
 *   License approved December 2025; casino projected to open ~2030.
 */

export interface ViceEntry {
  /** Display label for the venue */
  label: string;
  /** true = developer projection; false = real reported figures */
  isProjection: boolean;

  // ── Real-data fields (CD 410, Resorts World NYC) ────────────────────────
  /** Annual net gaming win at this venue (reported, FY 2024-25) */
  wonHereAnnual?: number;
  /** Estimated annual education fund remittance to Albany (derived) */
  toAlbanyAnnual?: number;
  /** Cumulative total remitted to NY state education fund since opening */
  cumulativeToState?: number;

  // ── Projection fields (CD 407, Metropolitan Park) ──────────────────────
  /** Projected annual gross gaming revenue (developer projection, Year 3 stable ops) */
  projectedRevenueAnnual?: number;
  /** Projected annual tax revenue to state (developer projection, Year 3) */
  projectedTaxesAnnual?: number;
  /** Developer community benefit pledge (total, not annual) */
  communityPledge?: number;

  /** Human-readable source attribution note */
  sourceNote: string;
}

const VICE_TABLE: Record<string, ViceEntry> = {
  // ── Queens CD 10 — South Ozone Park / Resorts World NYC ─────────────────
  // REAL DATA, FY 2024-25 (VGM era; full casino license issued Dec 2025).
  // Net win $692.4M: highest-grossing year to date (up 2.9% YoY).
  // Education remittance: ~40% of net win under Video Lottery Gaming structure = ~$277M (derived).
  // Cumulative: $4.5B–$5B range as of late 2025; $4.75B used as midpoint.
  "410": {
    label: "Resorts World NYC · Aqueduct",
    isProjection: false,
    wonHereAnnual: 692_400_000,
    toAlbanyAnnual: 277_000_000,
    cumulativeToState: 4_750_000_000,
    sourceNote:
      "Net win FY 2024-25: CasinoReports.com. Education remittance derived at 40% of net win (VGM structure). " +
      "Cumulative midpoint: QNS / RWNYC press releases ($4B milestone Jul 2023; ~$5B cited Nov 2025). " +
      "Resorts World received a full commercial casino license December 2025 — future contributions will differ.",
  },

  // ── Queens CD 7 — Flushing / Willets Point / proposed Metropolitan Park ─
  // ALL FIGURES ARE DEVELOPER PROJECTIONS from the license application, Oct 2025.
  // License approved December 2025; groundwork underway Feb 2026; projected opening ~2030.
  // Community pledge figures range $761M–$1.75B across sources (scope varies);
  //   $1.75B is the broadest, most recent figure.
  "407": {
    label: "Proposed Metropolitan Park (Willets Point)",
    isProjection: true,
    projectedRevenueAnnual: 3_900_000_000,
    projectedTaxesAnnual: 850_000_000,
    communityPledge: 1_750_000_000,
    sourceNote:
      "Developer projection — Metropolitan Park supplemental license application, Oct 2025. " +
      "Source: QNS (qns.com/2025/10/metropolitan-park-supplemental-application/). " +
      "License approved Dec 2025 by NY Gaming Facility Location Board; casino projected to open ~2030. " +
      "Community benefit pledge varies by source ($761M–$1.75B); $1.75B is broadest recent figure. " +
      "No signed community benefit agreement publicly available at time of research; figures are from developer marketing.",
  },
};

/**
 * Look up gaming vice data for a community district by boroCd (e.g. "410").
 * Returns null for non-casino districts or unknown IDs.
 */
export function viceFor(boroCd: string): ViceEntry | null {
  return VICE_TABLE[boroCd] ?? null;
}
