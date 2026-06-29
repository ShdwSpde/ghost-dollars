import { parseCommunityBoard } from "./cdId";
import { bucketForAgency, type Bucket } from "./categories";

export interface CapitalRecord {
  reporting_period?: string;
  fms_id?: string;
  budget_line?: string;
  community_board?: string;
  total_budget?: string | number;
  managing_agency?: string;
  ten_year_plan_category?: string;
}

export interface BucketTotals {
  neighborhood: number;
  citywide: number;
  other: number;
}

export interface CapitalAggregate {
  visibleByCd: Map<string, number>;
  totalVisible: number;
  totalDark: number;
  /** Per-CD dollar breakdown by agency bucket (neighborhood / citywide / other). */
  bucketsByCd?: Map<string, BucketTotals>;
  /**
   * Per-CD top categories by ten_year_plan_category, sorted descending by $.
   * Stored as a Map<cd, Map<category, dollars>> during accumulation; converted
   * to sorted arrays when consumed.
   */
  rawCategoryByCd?: Map<string, Map<string, number>>;
}

const amount = (v: string | number | undefined): number => {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export function aggregateCapital(records: CapitalRecord[]): CapitalAggregate {
  // 1. Keep only the latest reporting period (defensive — the fetch already scopes to it).
  const periods = records.map((r) => r.reporting_period).filter(Boolean) as string[];
  const latest = periods.length ? periods.reduce((a, b) => (b > a ? b : a)) : undefined;
  const scoped = latest ? records.filter((r) => r.reporting_period === latest) : records;

  // 2. Dedupe by fms_id|budget_line; 3. split each row's dollars across its placeable CDs.
  const seen = new Set<string>();
  const visibleByCd = new Map<string, number>();
  const bucketsByCd = new Map<string, BucketTotals>();
  const rawCategoryByCd = new Map<string, Map<string, number>>();
  let totalVisible = 0, totalDark = 0;
  for (const r of scoped) {
    const key = `${r.fms_id ?? ""}|${r.budget_line ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const dollars = amount(r.total_budget);
    const cds = parseCommunityBoard(r.community_board);
    if (cds.length > 0) {
      const share = dollars / cds.length;
      const bucket: Bucket = bucketForAgency(r.managing_agency ?? "");
      const category = (r.ten_year_plan_category ?? "").trim() || "Uncategorized";
      for (const cd of cds) {
        // Existing visible accumulation (UNCHANGED)
        visibleByCd.set(cd, (visibleByCd.get(cd) ?? 0) + share);
        totalVisible += share;

        // New: bucket accumulation
        if (!bucketsByCd.has(cd)) {
          bucketsByCd.set(cd, { neighborhood: 0, citywide: 0, other: 0 });
        }
        const bt = bucketsByCd.get(cd)!;
        bt[bucket] += share;

        // New: category accumulation
        if (!rawCategoryByCd.has(cd)) {
          rawCategoryByCd.set(cd, new Map());
        }
        const catMap = rawCategoryByCd.get(cd)!;
        catMap.set(category, (catMap.get(category) ?? 0) + share);
      }
    } else {
      totalDark += dollars;
    }
  }
  return { visibleByCd, totalVisible, totalDark, bucketsByCd, rawCategoryByCd };
}
