import { parseCommunityBoard } from "./cdId";

export interface CapitalRecord {
  reporting_period?: string;
  fms_id?: string;
  budget_line?: string;
  community_board?: string;
  total_budget?: string | number;
}
export interface CapitalAggregate {
  visibleByCd: Map<string, number>;
  totalVisible: number;
  totalDark: number;
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
  let totalVisible = 0, totalDark = 0;
  for (const r of scoped) {
    const key = `${r.fms_id ?? ""}|${r.budget_line ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const dollars = amount(r.total_budget);
    const cds = parseCommunityBoard(r.community_board);
    if (cds.length > 0) {
      const share = dollars / cds.length;
      for (const cd of cds) {
        visibleByCd.set(cd, (visibleByCd.get(cd) ?? 0) + share);
        totalVisible += share;
      }
    } else {
      totalDark += dollars;
    }
  }
  return { visibleByCd, totalVisible, totalDark };
}
