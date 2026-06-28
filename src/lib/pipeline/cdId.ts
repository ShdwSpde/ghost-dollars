export const BOROUGH_BY_DIGIT: Record<string, string> = {
  "1": "Manhattan", "2": "Bronx", "3": "Brooklyn", "4": "Queens", "5": "Staten Island",
};
const NAME_TO_DIGIT: Record<string, string> = {
  manhattan: "1", bronx: "2", brooklyn: "3", queens: "4", "staten island": "5",
  mn: "1", bx: "2", bk: "3", qn: "4", q: "4", si: "5",
};

export function normalizeCdId(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim().toLowerCase();
  if (s === "" || s.includes("citywide") || s.includes("various")) return null;

  // Pure 3-digit boro_cd, e.g. "412"
  if (/^\d{3}$/.test(s)) return s;

  // "<borough name or abbr> <number>" or "<abbr><number>", e.g. "queens 12", "q12"
  const m = s.match(/^([a-z ]+?)\s*(\d{1,2})$/);
  if (m) {
    const digit = NAME_TO_DIGIT[m[1].trim()];
    if (digit) return digit + m[2].padStart(2, "0");
  }
  return null;
}

export function cdNumber(boroCd: string): number {
  return parseInt(boroCd.slice(1), 10);
}

export function isPlaceable(boroCd: string | null): boolean {
  if (!boroCd || !/^\d{3}$/.test(boroCd)) return false;
  const n = cdNumber(boroCd);
  return n >= 1 && n <= 18;
}
