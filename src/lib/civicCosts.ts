// Cost constants — sourced figures only. Do not change without updating source comments.

// NYC School Construction Authority, FY2025–29 Five-Year Capital Plan (March 2025)
// https://council.nyc.gov/budget/wp-content/uploads/sites/54/2025/03/School-Construction-Authority-1.pdf
export const SCHOOL_SEAT = 180_000;

// NYC DOT First Deputy Commissioner Margaret Forgione, NYC Council Finance Committee hearing, May 13 2025
// https://citymeetings.nyc/meetings/new-york-city-council/2025-05-13-1000-am-committee-on-finance/
// "just under $200,000" per lane-mile (resurfacing only, not full reconstruction)
export const STREET_LANE_MILE = 200_000;

// NYCHA 2023 Physical Needs Assessment (released July 2023) — 20-year capital need
// $78.3 billion ÷ 161,400 apartments = $485,000/unit (planning estimate, not contractor price)
// https://www.nyc.gov/site/nycha/about/physical-needs-assessment-faqs.page
export const NYCHA_UNIT = 485_000;

// NYC Parks Capital Project Tracker — representative neighborhood playground reconstruction
// Range $3.5M–$5M; mid-range $4M used. No single official average published by NYC Parks.
// https://www.nycgovparks.org/planning-and-building/capital-project-tracker
export const PLAYGROUND = 4_000_000;

export interface ReceiptLine {
  label: string;
  qty: number;
  unit: string;
}

const GOODS: Array<{ cost: number; label: string; unit: string }> = [
  { cost: SCHOOL_SEAT,       label: "school seats",              unit: "@ $180K/seat (SCA FY25-29)" },
  { cost: STREET_LANE_MILE,  label: "lane-miles repaved",        unit: "@ $200K/lane-mi (DOT 2025)" },
  { cost: NYCHA_UNIT,        label: "NYCHA apartments repaired", unit: "@ $485K/unit (PNA 2023)" },
  { cost: PLAYGROUND,        label: "neighborhood playgrounds",  unit: "@ $4M/playground (Parks)" },
];

/**
 * For a given ghost-dollar gap, compute how many of each civic good
 * that gap could (illustratively) fund at published NYC unit costs.
 *
 * IMPORTANT: The result is illustrative only. These dollars are NOT earmarked
 * or allocated. This function shows scale, not a funding promise.
 *
 * @param ghostDollars - The funding gap in dollars (positive = under parity)
 * @returns Array of ReceiptLine items, skipping any with qty === 0
 */
export function receiptLines(ghostDollars: number): ReceiptLine[] {
  if (ghostDollars <= 0) return [];
  return GOODS
    .map(({ cost, label, unit }) => ({ label, unit, qty: Math.floor(ghostDollars / cost) }))
    .filter((l) => l.qty > 0);
}
