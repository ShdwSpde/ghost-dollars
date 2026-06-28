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
