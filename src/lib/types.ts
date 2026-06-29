export interface SpendByBucket {
  neighborhood: number;
  citywide: number;
  other: number;
}

export interface CdMetric {
  boroCd: string;
  population: number;
  medianHhIncome: number | null;
  pctBipoc: number | null;
  povertyRate: number | null;
  visibleCapital: number;
  perResidentCapital: number;
  expectedCapital: number;
  ghostDollars: number;
  perResidentPercentile: number;
  inCorridor: boolean;
  corridorNote?: string;
  /** Visible capital split by agency bucket. Additive — does not affect parity/ghost math. */
  spendByBucket: SpendByBucket;
  /** Top 3 ten_year_plan_category values by $ (descending). */
  topCategories: { category: string; amount: number }[];
}
export interface DatasetMeta {
  capitalWindow: string;
  totalVisibleCapital: number;
  totalDarkCapital: number;
  darkSharePct: number;
  parityPerResident: number;
  acsVintage: string;
}
export interface Dataset { meta: DatasetMeta; cds: CdMetric[]; }
