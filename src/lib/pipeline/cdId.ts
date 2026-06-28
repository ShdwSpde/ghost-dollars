export const BOROUGH_BY_DIGIT: Record<string, string> = {
  "1": "Manhattan", "2": "Bronx", "3": "Brooklyn", "4": "Queens", "5": "Staten Island",
};
const NAME_TO_DIGIT: Record<string, string> = {
  manhattan: "1", bronx: "2", brooklyn: "3", queens: "4", "staten island": "5",
  mn: "1", bx: "2", bk: "3", qn: "4", q: "4", si: "5",
};

export function normalizeCdId(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  let s = String(raw).trim().toLowerCase();
  if (s === "" || s.includes("citywide") || s.includes("various")) return null;

  // Strip a float-serialized integer, e.g. "412.0" -> "412".
  s = s.replace(/^(\d+)\.0+$/, "$1");

  // Pure 3-digit boro_cd with a valid borough digit (1-5).
  if (/^[1-5]\d{2}$/.test(s)) return s;

  // "<borough name or abbr> [CD] <1-2 digit number>", e.g. "queens 12", "q12", "queens cd 12".
  const m = s.match(/^([a-z. ]+?)\s*(\d{1,2})$/);
  if (m) {
    const name = m[1].trim().replace(/\s*c\.?d\.?$/, "").trim();
    const digit = NAME_TO_DIGIT[name];
    if (digit) return digit + m[2].padStart(2, "0");
  }
  return null;
}

export function cdNumber(boroCd: string): number {
  return parseInt(boroCd.slice(1), 10);
}

export function isPlaceable(boroCd: string | null): boolean {
  if (!boroCd || !/^[1-5]\d{2}$/.test(boroCd)) return false;
  const n = cdNumber(boroCd);
  return n >= 1 && n <= 18;
}
