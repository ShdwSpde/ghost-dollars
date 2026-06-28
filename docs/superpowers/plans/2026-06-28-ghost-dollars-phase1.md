# Ghost Dollars — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an interactive Next.js map that shows, per NYC community district, ghost dollars (under-investment vs. an equal-per-resident parity baseline) and dark dollars (capital the city can't place on a map), against neighborhood demographics — with an authored intro touring the Queens immigrant/casino corridor.

**Architecture:** An offline, versioned **data pipeline** (pure TypeScript functions, fully TDD'd) pulls the NYC Capital Projects Dashboard + community-district geometry + a committed ACS demographics CSV, joins them on a normalized community-district id, computes parity/ghost/dark/percentile, and emits two static artifacts (`public/data/cd-metrics.json`, `public/data/community-districts.geojson`). The **frontend** is a single-page Next.js (App Router) app that loads those static artifacts and renders three cross-highlighting panels (map, scatter, district card) plus an authored scroll intro. No runtime database in Phase 1.

**Tech Stack:** Next.js (App Router) + TypeScript, MapLibre GL JS (map), @observablehq/plot + a hand-written least-squares helper (scatter + regression), Vitest (unit tests), deployed on Vercel.

## Global Constraints

- **Geography unit:** NYC Community District (59 real CDs). Canonical join key = `boroCd` 3-digit string (borough digit 1–5 + 2-digit CD number), e.g. Queens CD12 = `"412"`.
- **Dark-dollar rule:** any capital dollar whose community board is missing, citywide, lump-sum, or a Joint Interest Area (CD number ≥ 64: parks/airports/cemeteries, no residents) is **dark** — excluded from BOTH the numerator and the parity pool, never silently dropped from one side.
- **Capital window (Phase 1 decision):** `total project budget` from the current Capital Projects Dashboard (`fb86-vt7u`). Disclosed verbatim in dataset meta as `"Total project budget, current Capital Projects Dashboard"`. Spend-to-date is a future toggle, not Phase 1.
- **Parity baseline:** flat equal-per-resident only. `parityPerResident = Σ visibleCapital / Σ population` over placeable CDs. Labeled a baseline, never an entitlement.
- **Reporting:** ghost dollars shown alongside a **percentile rank** of per-resident visible capital; never imply false precision.
- **Completeness caveat:** the dark-dollar share (≈47%, NYC Comptroller *Flying Blind on Billions*, Dec 2025) is a headline element, surfaced in the UI, never a footnote.
- **ACS vintage:** 2019–2023 5-year, consistent throughout. Do not mix vintages.
- **Corridor CDs:** `Q3 (403)`, `Q4 (404)`, `Q7 (407)`, `Q10 (410)`, `Q12 (412)`. CD7 note: proposed Metropolitan Park casino. CD10 note: Resorts World + Aqueduct.
- **311 layer is NOT in Phase 1**, but the caveat component (Task 12) must be built so a layer-locked caveat can be attached later.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `vitest.config.ts`, `app/layout.tsx`, `app/globals.css`, `data/raw/.gitkeep`, `src/lib/.gitkeep`, `public/data/.gitkeep`
- Test: `src/lib/__smoke__.test.ts`

**Interfaces:**
- Produces: a runnable Next.js + Vitest workspace. Later tasks add files under `src/lib/` (pipeline) and `app/` + `components/` (UI).

- [ ] **Step 1: Initialize the project and install dependencies**

```bash
cd /Users/spade/Desktop/ghost-dollars
npm init -y
npm install next@latest react@latest react-dom@latest maplibre-gl @observablehq/plot
npm install -D typescript @types/react @types/node vitest @vitejs/plugin-react jsdom
```

- [ ] **Step 2: Add config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "lib": ["dom", "dom.iterable", "ES2022"],
    "module": "ESNext", "moduleResolution": "Bundler", "jsx": "preserve",
    "strict": true, "noEmit": true, "esModuleInterop": true,
    "resolveJsonModule": true, "isolatedModules": true, "skipLibCheck": true,
    "incremental": true, "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", globals: true },
});
```

`next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
export default { reactStrictMode: true };
```

Add to `package.json` `"scripts"`: `"dev": "next dev"`, `"build": "next build"`, `"test": "vitest run"`, `"pipeline": "tsx src/lib/pipeline/run.ts"`. Install tsx: `npm install -D tsx`.

- [ ] **Step 3: Minimal app shell**

`app/layout.tsx`:
```tsx
export const metadata = { title: "Ghost Dollars", description: "What NYC's capital data leaves out" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
```
`app/globals.css`: empty for now (one line: `:root { color-scheme: light; }`).

- [ ] **Step 4: Smoke test**

`src/lib/__smoke__.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("workspace", () => { it("runs", () => { expect(1 + 1).toBe(2); }); });
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js + Vitest workspace"
```

---

### Task 2: Community-district id normalization

**Files:**
- Create: `src/lib/pipeline/cdId.ts`
- Test: `src/lib/pipeline/cdId.test.ts`

**Interfaces:**
- Produces:
  - `normalizeCdId(raw: string | number | null | undefined): string | null` → canonical 3-digit `boroCd` (e.g. `"412"`), or `null` if unparseable.
  - `cdNumber(boroCd: string): number` → the 1–2 digit CD number (e.g. `12` from `"412"`).
  - `isPlaceable(boroCd: string | null): boolean` → `true` only for real residential CDs (CD number 1–18); `false` for null, Joint Interest Areas (≥64), and citywide.
  - `BOROUGH_BY_DIGIT: Record<string,string>` = `{ "1":"Manhattan","2":"Bronx","3":"Brooklyn","4":"Queens","5":"Staten Island" }`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { normalizeCdId, cdNumber, isPlaceable } from "./cdId";

describe("normalizeCdId", () => {
  it("passes through 3-digit boro_cd", () => { expect(normalizeCdId("412")).toBe("412"); });
  it("handles numeric input", () => { expect(normalizeCdId(412)).toBe("412"); });
  it("parses 'Queens 12'", () => { expect(normalizeCdId("Queens 12")).toBe("412"); });
  it("parses 'Q12'", () => { expect(normalizeCdId("Q12")).toBe("412"); });
  it("pads single-digit CD numbers", () => { expect(normalizeCdId("Q3")).toBe("403"); });
  it("returns null for citywide", () => { expect(normalizeCdId("Citywide")).toBeNull(); });
  it("returns null for empty/missing", () => { expect(normalizeCdId("")).toBeNull(); expect(normalizeCdId(null)).toBeNull(); });
});
describe("cdNumber", () => { it("extracts CD number", () => { expect(cdNumber("412")).toBe(12); expect(cdNumber("403")).toBe(3); }); });
describe("isPlaceable", () => {
  it("true for residential CD", () => { expect(isPlaceable("412")).toBe(true); });
  it("false for Joint Interest Area (>=64)", () => { expect(isPlaceable("481")).toBe(false); });
  it("false for null", () => { expect(isPlaceable(null)).toBe(false); });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/pipeline/cdId.test.ts`
Expected: FAIL ("Cannot find module './cdId'").

- [ ] **Step 3: Write minimal implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/pipeline/cdId.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pipeline/cdId.ts src/lib/pipeline/cdId.test.ts
git commit -m "feat: community-district id normalization + placeability"
```

---

### Task 3: Fetch raw source data

**Files:**
- Create: `src/lib/pipeline/fetchRaw.ts`, `data/raw/README.md`
- Test: manual verification (network I/O; not unit-tested)

**Interfaces:**
- Produces: `data/raw/capital.json` (array of Dashboard records) and `data/raw/community-districts.geojson`. Documents the demographics CSV expected by Task 4.

- [ ] **Step 1: Write the fetch script**

`src/lib/pipeline/fetchRaw.ts`:
```ts
import { writeFile } from "node:fs/promises";

const CAPITAL_URL = "https://data.cityofnewyork.us/resource/fb86-vt7u.json?$limit=50000";
const GEO_URL = "https://data.cityofnewyork.us/api/geospatial/yfnk-k7r4?method=export&format=GeoJSON";

async function main() {
  const cap = await fetch(CAPITAL_URL, { headers: { Accept: "application/json" } });
  if (!cap.ok) throw new Error(`capital fetch ${cap.status}`);
  await writeFile("data/raw/capital.json", JSON.stringify(await cap.json(), null, 2));

  const geo = await fetch(GEO_URL);
  if (!geo.ok) throw new Error(`geo fetch ${geo.status}`);
  await writeFile("data/raw/community-districts.geojson", await geo.text());

  console.log("Wrote data/raw/capital.json and community-districts.geojson");
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Document the demographics CSV (manual source)**

`data/raw/README.md`:
```markdown
# Raw data

- `capital.json` — Capital Projects Dashboard (Socrata fb86-vt7u). Run `npx tsx src/lib/pipeline/fetchRaw.ts`.
- `community-districts.geojson` — CD boundaries (Socrata yfnk-k7r4). Same script.
- `demographics.csv` — **manually sourced** from NYC Population FactFinder (ACS 2019–2023),
  or DCP static ACS CD profile spreadsheets. NO clean bulk API exists.
  Required columns (header row, one row per real CD):
  `boro_cd,population,median_hh_income,pct_bipoc,poverty_rate`
  where boro_cd is the 3-digit code (e.g. 412), pct_bipoc and poverty_rate are 0–100.
```

- [ ] **Step 3: Run the fetch and verify shape**

Run: `npx tsx src/lib/pipeline/fetchRaw.ts`
Then: `node -e "const c=require('./data/raw/capital.json'); console.log(c.length, Object.keys(c[0]))"`
Expected: a positive record count and field names including a community-board field and a budget field. **Record the exact field names** (e.g. `community_board`, `total_budget`) — Task 5 depends on them.

- [ ] **Step 4: Commit (script + geometry + demographics; capital.json may be large — keep it)**

```bash
git add src/lib/pipeline/fetchRaw.ts data/raw/README.md data/raw/community-districts.geojson data/raw/demographics.csv
git commit -m "feat: raw data fetch script + community-district geometry"
```

---

### Task 4: Parse demographics CSV

**Files:**
- Create: `src/lib/pipeline/demographics.ts`
- Test: `src/lib/pipeline/demographics.test.ts`

**Interfaces:**
- Consumes: `normalizeCdId` from Task 2.
- Produces:
  - `interface Demographics { boroCd: string; population: number; medianHhIncome: number | null; pctBipoc: number | null; povertyRate: number | null; }`
  - `parseDemographicsCsv(csv: string): Map<string, Demographics>` keyed by `boroCd`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { parseDemographicsCsv } from "./demographics";

const CSV = `boro_cd,population,median_hh_income,pct_bipoc,poverty_rate
412,225919,67000,93.2,15.1
403,171576,58000,88.0,17.4
,100,,,`;

describe("parseDemographicsCsv", () => {
  it("parses rows keyed by boroCd", () => {
    const m = parseDemographicsCsv(CSV);
    expect(m.get("412")?.population).toBe(225919);
    expect(m.get("412")?.medianHhIncome).toBe(67000);
    expect(m.get("403")?.pctBipoc).toBeCloseTo(88.0);
  });
  it("skips rows with no parseable boro_cd", () => {
    expect(parseDemographicsCsv(CSV).has("")).toBe(false);
  });
  it("coerces blank numerics to null", () => {
    const csv = `boro_cd,population,median_hh_income,pct_bipoc,poverty_rate\n412,225919,,,`;
    const d = parseDemographicsCsv(csv).get("412")!;
    expect(d.medianHhIncome).toBeNull();
    expect(d.povertyRate).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/pipeline/demographics.test.ts`
Expected: FAIL ("Cannot find module './demographics'").

- [ ] **Step 3: Write minimal implementation**

```ts
import { normalizeCdId } from "./cdId";

export interface Demographics {
  boroCd: string;
  population: number;
  medianHhIncome: number | null;
  pctBipoc: number | null;
  povertyRate: number | null;
}

const num = (s: string): number | null => {
  const t = s?.trim();
  if (!t) return null;
  const n = Number(t.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export function parseDemographicsCsv(csv: string): Map<string, Demographics> {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(",").map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const out = new Map<string, Demographics>();
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const boroCd = normalizeCdId(cells[idx("boro_cd")]);
    if (!boroCd) continue;
    out.set(boroCd, {
      boroCd,
      population: num(cells[idx("population")]) ?? 0,
      medianHhIncome: num(cells[idx("median_hh_income")]),
      pctBipoc: num(cells[idx("pct_bipoc")]),
      povertyRate: num(cells[idx("poverty_rate")]),
    });
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/pipeline/demographics.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pipeline/demographics.ts src/lib/pipeline/demographics.test.ts
git commit -m "feat: demographics CSV parser"
```

---

### Task 5: Classify + aggregate capital into visible / dark by CD

> **REVISED 2026-06-28 after inspecting live data.** The Dashboard stores one row per project budget-line *per reporting period* and republishes ~3×/yr; naively summing `total_budget` over all rows over-counts ~10× (~$1.6T vs the real ~$158B). And `community_board` arrives in several formats including redundant-borough (`"Manhattan, Manhattan 03"`) and **multi-CD** (`"Manhattan 01, Manhattan 12"`) strings. The corrected aggregation: (1) keep only the latest `reporting_period`; (2) dedupe by `fms_id | budget_line`; (3) parse `community_board` into the *list* of placeable CDs and split `total_budget` equally across them; borough-only/Citywide → dark. This task also adds a `parseCommunityBoard` helper to `cdId.ts`.

**Files:**
- Modify: `src/lib/pipeline/cdId.ts` (add `parseCommunityBoard`), `src/lib/pipeline/cdId.test.ts`
- Create: `src/lib/pipeline/capital.ts`
- Test: `src/lib/pipeline/capital.test.ts`

**Interfaces:**
- Consumes: `normalizeCdId`, `isPlaceable` from Task 2.
- Produces:
  - `parseCommunityBoard(raw: string | null | undefined): string[]` (in `cdId.ts`) — list of distinct placeable `boroCd`s named by a `community_board` string.
  - `interface CapitalRecord { reporting_period?: string; fms_id?: string; budget_line?: string; community_board?: string; total_budget?: string | number; }` (field names verified against live data in Task 3).
  - `interface CapitalAggregate { visibleByCd: Map<string, number>; totalVisible: number; totalDark: number; }`
  - `aggregateCapital(records: CapitalRecord[]): CapitalAggregate`.

- [ ] **Step 1: Add `parseCommunityBoard` tests to `src/lib/pipeline/cdId.test.ts`** (import it alongside the existing imports)

```ts
import { parseCommunityBoard } from "./cdId";

describe("parseCommunityBoard", () => {
  it("single CD", () => { expect(parseCommunityBoard("Bronx 12")).toEqual(["212"]); });
  it("redundant-borough single CD", () => { expect(parseCommunityBoard("Manhattan, Manhattan 03")).toEqual(["103"]); });
  it("multi-CD list", () => { expect(parseCommunityBoard("Queens 07, Queens 08")).toEqual(["407", "408"]); });
  it("borough-only -> empty", () => { expect(parseCommunityBoard("Brooklyn")).toEqual([]); });
  it("citywide -> empty", () => { expect(parseCommunityBoard("Citywide")).toEqual([]); });
  it("dedups repeated CDs", () => { expect(parseCommunityBoard("Manhattan 03, Manhattan 03")).toEqual(["103"]); });
  it("empty/null -> empty", () => { expect(parseCommunityBoard("")).toEqual([]); expect(parseCommunityBoard(null)).toEqual([]); });
});
```

- [ ] **Step 2: Add `parseCommunityBoard` to `src/lib/pipeline/cdId.ts`**

```ts
export function parseCommunityBoard(raw: string | null | undefined): string[] {
  if (raw === null || raw === undefined) return [];
  const out: string[] = [];
  for (const seg of String(raw).split(",")) {
    const cd = normalizeCdId(seg);
    if (cd && isPlaceable(cd) && !out.includes(cd)) out.push(cd);
  }
  return out;
}
```

- [ ] **Step 3: Write the failing test `src/lib/pipeline/capital.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { aggregateCapital } from "./capital";

describe("aggregateCapital", () => {
  it("uses only the latest period, dedups by fms_id|budget_line, splits multi-CD equally, pools the rest as dark", () => {
    const recs = [
      // older period — must be ignored entirely
      { reporting_period: "202405", fms_id: "OLD", budget_line: "L1", community_board: "412", total_budget: "99999" },
      // latest period
      { reporting_period: "202601", fms_id: "A", budget_line: "L1", community_board: "412", total_budget: "1000" },
      { reporting_period: "202601", fms_id: "A", budget_line: "L1", community_board: "412", total_budget: "1000" }, // dup -> ignored
      { reporting_period: "202601", fms_id: "B", budget_line: "L1", community_board: "Manhattan, Manhattan 03", total_budget: "600" }, // single CD via comma
      { reporting_period: "202601", fms_id: "C", budget_line: "L1", community_board: "Queens 07, Queens 08", total_budget: "400" }, // multi -> 200/200
      { reporting_period: "202601", fms_id: "D", budget_line: "L1", community_board: "Citywide", total_budget: "5000" }, // dark
      { reporting_period: "202601", fms_id: "E", budget_line: "L1", community_board: "Brooklyn", total_budget: "700" }, // dark (borough only)
    ];
    const agg = aggregateCapital(recs);
    expect(agg.visibleByCd.get("412")).toBe(1000); // old period + dup both ignored
    expect(agg.visibleByCd.get("103")).toBe(600);  // Manhattan 03
    expect(agg.visibleByCd.get("407")).toBe(200);  // Queens 07 half
    expect(agg.visibleByCd.get("408")).toBe(200);  // Queens 08 half
    expect(agg.totalVisible).toBe(2000);           // 1000 + 600 + 400
    expect(agg.totalDark).toBe(5700);              // 5000 + 700
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/lib/pipeline/capital.test.ts`
Expected: FAIL ("Cannot find module './capital'").

- [ ] **Step 5: Write `src/lib/pipeline/capital.ts`**

```ts
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
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/lib/pipeline/cdId.test.ts src/lib/pipeline/capital.test.ts`
Expected: PASS (existing cdId tests + new parseCommunityBoard tests + the aggregate test).

- [ ] **Step 7: Commit**

```bash
git add src/lib/pipeline/cdId.ts src/lib/pipeline/cdId.test.ts src/lib/pipeline/capital.ts src/lib/pipeline/capital.test.ts
git commit -m "feat: aggregate capital by latest period, dedup, multi-CD split"
```

---

### Task 6: Compute parity, ghost dollars, and percentile

**Files:**
- Create: `src/lib/pipeline/metrics.ts`, `src/lib/types.ts`
- Test: `src/lib/pipeline/metrics.test.ts`

**Interfaces:**
- Consumes: `Demographics` (Task 4), `CapitalAggregate` (Task 5), corridor constants.
- Produces (in `src/lib/types.ts`, shared with the frontend):
  - `interface CdMetric { boroCd: string; population: number; medianHhIncome: number|null; pctBipoc: number|null; povertyRate: number|null; visibleCapital: number; perResidentCapital: number; expectedCapital: number; ghostDollars: number; perResidentPercentile: number; inCorridor: boolean; corridorNote?: string; }`
  - `interface DatasetMeta { capitalWindow: string; totalVisibleCapital: number; totalDarkCapital: number; darkSharePct: number; parityPerResident: number; acsVintage: string; }`
  - `interface Dataset { meta: DatasetMeta; cds: CdMetric[]; }`
- Produces (in `metrics.ts`): `buildMetrics(demo: Map<string,Demographics>, agg: CapitalAggregate): Dataset`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildMetrics } from "./metrics";

const demo = new Map([
  ["412", { boroCd: "412", population: 100, medianHhIncome: 50000, pctBipoc: 90, povertyRate: 15 }],
  ["403", { boroCd: "403", population: 100, medianHhIncome: 60000, pctBipoc: 80, povertyRate: 12 }],
]);

describe("buildMetrics", () => {
  it("computes parity as total visible / total population over placeable CDs", () => {
    const agg = { visibleByCd: new Map([["412", 100], ["403", 300]]), totalVisible: 400, totalDark: 600 };
    const ds = buildMetrics(demo, agg);
    expect(ds.meta.parityPerResident).toBe(2); // 400 / 200
    expect(ds.meta.darkSharePct).toBeCloseTo(60); // 600 / (400+600)
  });
  it("computes ghost dollars = expected - visible", () => {
    const agg = { visibleByCd: new Map([["412", 100], ["403", 300]]), totalVisible: 400, totalDark: 0 };
    const ds = buildMetrics(demo, agg);
    const cd412 = ds.cds.find((c) => c.boroCd === "412")!;
    expect(cd412.expectedCapital).toBe(200); // parity 2 * pop 100
    expect(cd412.ghostDollars).toBe(100);    // 200 - 100 (under parity)
  });
  it("assigns percentile rank of per-resident capital (lowest = 0)", () => {
    const agg = { visibleByCd: new Map([["412", 100], ["403", 300]]), totalVisible: 400, totalDark: 0 };
    const ds = buildMetrics(demo, agg);
    expect(ds.cds.find((c) => c.boroCd === "412")!.perResidentPercentile).toBe(0);
    expect(ds.cds.find((c) => c.boroCd === "403")!.perResidentPercentile).toBe(100);
  });
  it("flags corridor CDs with notes", () => {
    const agg = { visibleByCd: new Map([["412", 100], ["403", 300]]), totalVisible: 400, totalDark: 0 };
    const cd412 = buildMetrics(demo, agg).cds.find((c) => c.boroCd === "412")!;
    expect(cd412.inCorridor).toBe(true);
  });
  it("treats a CD with demographics but zero visible capital as ghost = expected", () => {
    const agg = { visibleByCd: new Map([["403", 300]]), totalVisible: 300, totalDark: 0 };
    const cd412 = buildMetrics(demo, agg).cds.find((c) => c.boroCd === "412")!;
    expect(cd412.visibleCapital).toBe(0);
    expect(cd412.ghostDollars).toBe(cd412.expectedCapital);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/pipeline/metrics.test.ts`
Expected: FAIL ("Cannot find module './metrics'").

- [ ] **Step 3: Write `src/lib/types.ts`**

```ts
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
```

- [ ] **Step 4: Write `src/lib/pipeline/metrics.ts`**

```ts
import type { Demographics } from "./demographics";
import type { CapitalAggregate } from "./capital";
import type { CdMetric, Dataset } from "../types";

export const CORRIDOR_NOTES: Record<string, string> = {
  "403": "Jackson Heights / North Corona",
  "404": "Elmhurst / Corona",
  "407": "Flushing / Willets Point — proposed Metropolitan Park casino",
  "410": "South Ozone Park / Howard Beach — Resorts World + Aqueduct",
  "412": "Jamaica / St. Albans / Hollis",
};

export function buildMetrics(demo: Map<string, Demographics>, agg: CapitalAggregate): Dataset {
  const placeable = [...demo.values()].filter((d) => d.population > 0);
  const totalPop = placeable.reduce((s, d) => s + d.population, 0);
  const parityPerResident = totalPop > 0 ? agg.totalVisible / totalPop : 0;

  // Per-resident values first, to rank into percentiles.
  const withPerResident = placeable.map((d) => {
    const visibleCapital = agg.visibleByCd.get(d.boroCd) ?? 0;
    return { d, visibleCapital, perResidentCapital: visibleCapital / d.population };
  });
  const sorted = [...withPerResident].sort((a, b) => a.perResidentCapital - b.perResidentCapital);
  const n = sorted.length;
  const percentileByCd = new Map<string, number>();
  sorted.forEach((row, i) => {
    percentileByCd.set(row.d.boroCd, n > 1 ? Math.round((i / (n - 1)) * 100) : 100);
  });

  const cds: CdMetric[] = withPerResident.map(({ d, visibleCapital, perResidentCapital }) => {
    const expectedCapital = parityPerResident * d.population;
    return {
      boroCd: d.boroCd,
      population: d.population,
      medianHhIncome: d.medianHhIncome,
      pctBipoc: d.pctBipoc,
      povertyRate: d.povertyRate,
      visibleCapital,
      perResidentCapital,
      expectedCapital,
      ghostDollars: expectedCapital - visibleCapital,
      perResidentPercentile: percentileByCd.get(d.boroCd) ?? 0,
      inCorridor: d.boroCd in CORRIDOR_NOTES,
      corridorNote: CORRIDOR_NOTES[d.boroCd],
    };
  });

  const totalCapital = agg.totalVisible + agg.totalDark;
  return {
    meta: {
      capitalWindow: "Total project budget, current Capital Projects Dashboard",
      totalVisibleCapital: agg.totalVisible,
      totalDarkCapital: agg.totalDark,
      darkSharePct: totalCapital > 0 ? (agg.totalDark / totalCapital) * 100 : 0,
      parityPerResident,
      acsVintage: "2019–2023",
    },
    cds,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/pipeline/metrics.test.ts`
Expected: PASS (all 5 cases).

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/pipeline/metrics.ts src/lib/pipeline/metrics.test.ts
git commit -m "feat: parity, ghost dollars, percentile, corridor flags"
```

---

### Task 7: Pipeline orchestrator → static artifacts

**Files:**
- Create: `src/lib/pipeline/run.ts`
- Test: integration run + assertions on output files

**Interfaces:**
- Consumes: all of `src/lib/pipeline/*` (Tasks 2,4,5,6).
- Produces: `public/data/cd-metrics.json` (a `Dataset`) and `public/data/community-districts.geojson` (CD geometry with each feature's `boro_cd` normalized into `properties.boroCd`).

- [ ] **Step 1: Write the orchestrator**

```ts
import { readFile, writeFile } from "node:fs/promises";
import { parseDemographicsCsv } from "./demographics";
import { aggregateCapital, type CapitalRecord } from "./capital";
import { buildMetrics } from "./metrics";
import { normalizeCdId } from "./cdId";

async function main() {
  const capital = JSON.parse(await readFile("data/raw/capital.json", "utf8")) as CapitalRecord[];
  const demo = parseDemographicsCsv(await readFile("data/raw/demographics.csv", "utf8"));
  const geo = JSON.parse(await readFile("data/raw/community-districts.geojson", "utf8"));

  const dataset = buildMetrics(demo, aggregateCapital(capital));

  // Normalize a stable join key onto every geometry feature.
  for (const f of geo.features) {
    const p = f.properties ?? {};
    p.boroCd = normalizeCdId(p.boro_cd ?? p.BoroCD ?? p.borocd);
    f.properties = p;
  }

  await writeFile("public/data/cd-metrics.json", JSON.stringify(dataset, null, 2));
  await writeFile("public/data/community-districts.geojson", JSON.stringify(geo));
  console.log(`Wrote ${dataset.cds.length} CDs. Dark share: ${dataset.meta.darkSharePct.toFixed(1)}%`);
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the pipeline**

Run: `npm run pipeline`
Expected: prints a CD count near 59 and a dark share roughly in the 40–60% range (sanity-check against the Comptroller's ~47%). If dark share is ~0% or ~100%, the capital field names from Task 3 are wrong — fix `CapitalRecord` field names in `src/lib/pipeline/capital.ts`.

- [ ] **Step 3: Verify the artifact shape**

Run: `node -e "const d=require('./public/data/cd-metrics.json'); const q12=d.cds.find(c=>c.boroCd==='412'); console.log(d.meta, q12)"`
Expected: `meta` has a non-zero `parityPerResident` and `darkSharePct`; CD `412` (Jamaica) has populated `ghostDollars`, `perResidentPercentile`, and `inCorridor: true`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pipeline/run.ts public/data/cd-metrics.json public/data/community-districts.geojson
git commit -m "feat: pipeline orchestrator emits static metric + geometry artifacts"
```

---

### Task 8: App data loading + shared selection state

**Files:**
- Create: `src/lib/loadData.ts`, `components/AtlasProvider.tsx`
- Test: `src/lib/loadData.test.ts`

**Interfaces:**
- Consumes: `Dataset`, `CdMetric` (Task 6 types); `public/data/cd-metrics.json`.
- Produces:
  - `getMetricValue(cd: CdMetric, metric: MetricKey): number` where `type MetricKey = "actual" | "perResident" | "ghost"`.
  - React context `AtlasProvider` exposing `{ dataset, metric, setMetric, overlay, setOverlay, selectedCd, setSelectedCd, hoverCd, setHoverCd }` with `type OverlayKey = "none" | "medianHhIncome" | "pctBipoc" | "povertyRate"`.

- [ ] **Step 1: Write the failing test for the pure selector**

```ts
import { describe, it, expect } from "vitest";
import { getMetricValue } from "./loadData";

const cd = { boroCd: "412", visibleCapital: 1500, perResidentCapital: 7.5, ghostDollars: 300 } as any;
describe("getMetricValue", () => {
  it("returns the field for each metric key", () => {
    expect(getMetricValue(cd, "actual")).toBe(1500);
    expect(getMetricValue(cd, "perResident")).toBe(7.5);
    expect(getMetricValue(cd, "ghost")).toBe(300);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/loadData.test.ts`
Expected: FAIL ("Cannot find module './loadData'").

- [ ] **Step 3: Implement loader + selector**

`src/lib/loadData.ts`:
```ts
import type { CdMetric, Dataset } from "./types";
export type MetricKey = "actual" | "perResident" | "ghost";
export type OverlayKey = "none" | "medianHhIncome" | "pctBipoc" | "povertyRate";

export function getMetricValue(cd: CdMetric, metric: MetricKey): number {
  if (metric === "actual") return cd.visibleCapital;
  if (metric === "perResident") return cd.perResidentCapital;
  return cd.ghostDollars;
}
export async function loadDataset(): Promise<Dataset> {
  const res = await fetch("/data/cd-metrics.json");
  return res.json();
}
```

- [ ] **Step 4: Implement the provider**

`components/AtlasProvider.tsx`:
```tsx
"use client";
import { createContext, useContext, useState } from "react";
import type { Dataset } from "@/src/lib/types";
import type { MetricKey, OverlayKey } from "@/src/lib/loadData";

interface AtlasState {
  dataset: Dataset;
  metric: MetricKey; setMetric: (m: MetricKey) => void;
  overlay: OverlayKey; setOverlay: (o: OverlayKey) => void;
  selectedCd: string | null; setSelectedCd: (b: string | null) => void;
  hoverCd: string | null; setHoverCd: (b: string | null) => void;
}
const Ctx = createContext<AtlasState | null>(null);
export const useAtlas = () => { const c = useContext(Ctx); if (!c) throw new Error("AtlasProvider missing"); return c; };

export function AtlasProvider({ dataset, children }: { dataset: Dataset; children: React.ReactNode }) {
  const [metric, setMetric] = useState<MetricKey>("ghost");
  const [overlay, setOverlay] = useState<OverlayKey>("none");
  const [selectedCd, setSelectedCd] = useState<string | null>(null);
  const [hoverCd, setHoverCd] = useState<string | null>(null);
  return <Ctx.Provider value={{ dataset, metric, setMetric, overlay, setOverlay, selectedCd, setSelectedCd, hoverCd, setHoverCd }}>{children}</Ctx.Provider>;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/loadData.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/loadData.ts src/lib/loadData.test.ts components/AtlasProvider.tsx
git commit -m "feat: dataset loader, metric selector, shared atlas state"
```

---

### Task 9: Map panel (MapLibre choropleth + toggles)

**Files:**
- Create: `components/MapPanel.tsx`, `components/MetricToggle.tsx`, `src/lib/colorScale.ts`
- Test: `src/lib/colorScale.test.ts` (color logic unit-tested; map rendering verified in browser)

**Interfaces:**
- Consumes: `useAtlas`, `getMetricValue`, the merged GeoJSON, `CdMetric`.
- Produces: `colorForValue(value: number, min: number, max: number, metric: MetricKey): string`; a rendered MapLibre map joining `properties.boroCd` → metric.

- [ ] **Step 1: Write the failing test for the color scale**

```ts
import { describe, it, expect } from "vitest";
import { colorForValue } from "./colorScale";

describe("colorForValue", () => {
  it("returns a neutral color at the low end", () => {
    expect(colorForValue(0, 0, 100, "ghost")).toMatch(/^#|rgb/);
  });
  it("maps higher ghost dollars to a more intense color than lower", () => {
    const lo = colorForValue(10, 0, 100, "ghost");
    const hi = colorForValue(90, 0, 100, "ghost");
    expect(lo).not.toBe(hi);
  });
  it("clamps out-of-range values without throwing", () => {
    expect(() => colorForValue(999, 0, 100, "ghost")).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/colorScale.test.ts`
Expected: FAIL ("Cannot find module './colorScale'").

- [ ] **Step 3: Implement the color scale**

`src/lib/colorScale.ts`:
```ts
import type { MetricKey } from "./loadData";
// Ghost = absence → a "missing/negative space" ramp (pale to deep magenta-red).
// Actual/perResident = presence → pale to deep teal.
const RAMPS: Record<MetricKey, string[]> = {
  ghost: ["#f3e9ee", "#d98aa9", "#b03a6e", "#7a1f48"],
  actual: ["#e8f2f1", "#8fc9c4", "#3f9690", "#1d5f5b"],
  perResident: ["#e8f2f1", "#8fc9c4", "#3f9690", "#1d5f5b"],
};
export function colorForValue(value: number, min: number, max: number, metric: MetricKey): string {
  const ramp = RAMPS[metric];
  const t = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  const idx = Math.min(ramp.length - 1, Math.floor(t * (ramp.length - 1)));
  return ramp[idx];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/colorScale.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement MapPanel + MetricToggle**

`components/MetricToggle.tsx`:
```tsx
"use client";
import { useAtlas } from "./AtlasProvider";
import type { MetricKey, OverlayKey } from "@/src/lib/loadData";
const METRICS: [MetricKey, string][] = [["actual","Actual $"],["perResident","Per-resident $"],["ghost","Ghost $"]];
const OVERLAYS: [OverlayKey, string][] = [["none","No overlay"],["medianHhIncome","Median income"],["pctBipoc","% BIPOC"],["povertyRate","Poverty rate"]];
export function MetricToggle() {
  const { metric, setMetric, overlay, setOverlay } = useAtlas();
  return (
    <div className="toggle-bar">
      <div role="radiogroup" aria-label="Metric">
        {METRICS.map(([k,l]) => <button key={k} aria-pressed={metric===k} onClick={()=>setMetric(k)}>{l}</button>)}
      </div>
      <select aria-label="Demographic overlay" value={overlay} onChange={(e)=>setOverlay(e.target.value as OverlayKey)}>
        {OVERLAYS.map(([k,l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </div>
  );
}
```

`components/MapPanel.tsx`:
```tsx
"use client";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAtlas } from "./AtlasProvider";
import { getMetricValue } from "@/src/lib/loadData";
import { colorForValue } from "@/src/lib/colorScale";

export function MapPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { dataset, metric, selectedCd, setSelectedCd, setHoverCd } = useAtlas();

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#0e0e10" } }] },
      center: [-73.87, 40.71], zoom: 9.7,
    });
    mapRef.current = map;
    map.on("load", async () => {
      const geo = await (await fetch("/data/community-districts.geojson")).json();
      const byCd = new Map(dataset.cds.map((c) => [c.boroCd, c]));
      const values = dataset.cds.map((c) => getMetricValue(c, metric));
      const min = Math.min(...values), max = Math.max(...values);
      for (const f of geo.features) {
        const cd = byCd.get(f.properties.boroCd);
        f.properties.fill = cd ? colorForValue(getMetricValue(cd, metric), min, max, metric) : "#1a1a1d";
      }
      map.addSource("cds", { type: "geojson", data: geo });
      map.addLayer({ id: "cd-fill", type: "fill", source: "cds", paint: { "fill-color": ["get","fill"], "fill-opacity": 0.85 } });
      map.addLayer({ id: "cd-line", type: "line", source: "cds", paint: { "line-color": "#0e0e10", "line-width": 0.5 } });
      map.on("click", "cd-fill", (e) => setSelectedCd(e.features?.[0]?.properties?.boroCd ?? null));
      map.on("mousemove", "cd-fill", (e) => setHoverCd(e.features?.[0]?.properties?.boroCd ?? null));
      map.on("mouseleave", "cd-fill", () => setHoverCd(null));
    });
  }, [dataset]);

  // Recolor on metric change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource("cds")) return;
    (async () => {
      const geo = await (await fetch("/data/community-districts.geojson")).json();
      const byCd = new Map(dataset.cds.map((c) => [c.boroCd, c]));
      const values = dataset.cds.map((c) => getMetricValue(c, metric));
      const min = Math.min(...values), max = Math.max(...values);
      for (const f of geo.features) {
        const cd = byCd.get(f.properties.boroCd);
        f.properties.fill = cd ? colorForValue(getMetricValue(cd, metric), min, max, metric) : "#1a1a1d";
      }
      (map.getSource("cds") as maplibregl.GeoJSONSource).setData(geo);
    })();
  }, [metric, dataset]);

  return <div ref={ref} style={{ position: "absolute", inset: 0 }} aria-label="Community district map" />;
}
```

- [ ] **Step 6: Verify in browser**

Run: `npm run dev`, open `http://localhost:3000` (after Task 13 wires the page). Use the verification skill / agent-browser to confirm: 59 CDs render, the Ghost toggle recolors the map, clicking a CD sets selection, no console errors.

- [ ] **Step 7: Commit**

```bash
git add components/MapPanel.tsx components/MetricToggle.tsx src/lib/colorScale.ts src/lib/colorScale.test.ts
git commit -m "feat: MapLibre choropleth with metric/overlay toggles and color scale"
```

---

### Task 10: Pattern panel (scatter + regression)

**Files:**
- Create: `components/PatternPanel.tsx`, `src/lib/regression.ts`
- Test: `src/lib/regression.test.ts`

**Interfaces:**
- Consumes: `useAtlas`, `CdMetric`, `OverlayKey`.
- Produces: `linearRegression(points: {x:number;y:number}[]): { slope:number; intercept:number; r2:number }`; a scatter of per-resident capital (y) vs. the chosen demographic (x) with the regression line drawn.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { linearRegression } from "./regression";

describe("linearRegression", () => {
  it("fits a perfect line", () => {
    const r = linearRegression([{x:0,y:0},{x:1,y:2},{x:2,y:4}]);
    expect(r.slope).toBeCloseTo(2);
    expect(r.intercept).toBeCloseTo(0);
    expect(r.r2).toBeCloseTo(1);
  });
  it("handles a downward slope", () => {
    const r = linearRegression([{x:0,y:10},{x:1,y:8},{x:2,y:6}]);
    expect(r.slope).toBeCloseTo(-2);
  });
  it("returns slope 0 for fewer than 2 points", () => {
    expect(linearRegression([{x:1,y:1}]).slope).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/regression.test.ts`
Expected: FAIL ("Cannot find module './regression'").

- [ ] **Step 3: Implement regression**

`src/lib/regression.ts`:
```ts
export function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: n === 1 ? points[0].y : 0, r2: 0 };
  const sx = points.reduce((s, p) => s + p.x, 0);
  const sy = points.reduce((s, p) => s + p.y, 0);
  const sxx = points.reduce((s, p) => s + p.x * p.x, 0);
  const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
  const denom = n * sxx - sx * sx;
  const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  const my = sy / n;
  const ssTot = points.reduce((s, p) => s + (p.y - my) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/regression.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement PatternPanel**

`components/PatternPanel.tsx`:
```tsx
"use client";
import { useEffect, useRef, useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { useAtlas } from "./AtlasProvider";
import { linearRegression } from "@/src/lib/regression";
import type { OverlayKey } from "@/src/lib/loadData";

const LABELS: Record<Exclude<OverlayKey,"none">, string> = {
  medianHhIncome: "Median household income ($)", pctBipoc: "% BIPOC", povertyRate: "Poverty rate (%)",
};
export function PatternPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const { dataset, overlay, hoverCd, setHoverCd } = useAtlas();
  const dim = overlay === "none" ? "pctBipoc" : overlay;
  const points = useMemo(() => dataset.cds
    .filter((c) => c[dim] != null && c.population > 0)
    .map((c) => ({ x: c[dim] as number, y: c.perResidentCapital, boroCd: c.boroCd, inCorridor: c.inCorridor })), [dataset, dim]);

  useEffect(() => {
    if (!ref.current) return;
    const reg = linearRegression(points);
    const xs = points.map((p) => p.x);
    const xmin = Math.min(...xs), xmax = Math.max(...xs);
    const chart = Plot.plot({
      marginLeft: 60, height: 320,
      x: { label: LABELS[dim as keyof typeof LABELS] }, y: { label: "Capital $ / resident" },
      marks: [
        Plot.dot(points, { x: "x", y: "y", r: (d)=>d.boroCd===hoverCd?7:4, fill: (d)=>d.inCorridor?"#b03a6e":"#3f9690",
          title: (d)=>`CD ${d.boroCd}`, }),
        Plot.line([{x:xmin,y:reg.slope*xmin+reg.intercept},{x:xmax,y:reg.slope*xmax+reg.intercept}], { x:"x", y:"y", stroke:"#e2b13c", strokeWidth:2 }),
      ],
    });
    ref.current.replaceChildren(chart);
    return () => chart.remove();
  }, [points, hoverCd, dim]);

  return <div ref={ref} aria-label="Pattern scatter: per-resident capital vs demographics" />;
}
```

- [ ] **Step 6: Verify in browser**

After page wiring (Task 13): switching the overlay changes the x-axis and redraws the regression line; corridor dots render in the ghost color. Confirm no console errors.

- [ ] **Step 7: Commit**

```bash
git add components/PatternPanel.tsx src/lib/regression.ts src/lib/regression.test.ts
git commit -m "feat: pattern scatter with least-squares regression line"
```

---

### Task 11: District card

**Files:**
- Create: `components/DistrictCard.tsx`, `src/lib/format.ts`
- Test: `src/lib/format.test.ts`

**Interfaces:**
- Consumes: `useAtlas`, `CdMetric`, `CORRIDOR_NOTES`.
- Produces: `fmtUsd(n: number): string`, `fmtPct(n: number|null): string`, `ghostSentence(cd: CdMetric): string`; a card bound to `selectedCd`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { fmtUsd, fmtPct, ghostSentence } from "./format";

describe("formatters", () => {
  it("formats USD compactly", () => { expect(fmtUsd(1500000)).toBe("$1.5M"); expect(fmtUsd(2300)).toBe("$2.3K"); });
  it("formats percent or dash", () => { expect(fmtPct(15.1)).toBe("15.1%"); expect(fmtPct(null)).toBe("—"); });
  it("writes an under-parity sentence", () => {
    const s = ghostSentence({ boroCd:"412", ghostDollars: 5_000_000, perResidentPercentile: 8, population: 225919 } as any);
    expect(s).toContain("below");
    expect(s).toContain("8");
  });
  it("writes an over-parity sentence when ghost is negative", () => {
    const s = ghostSentence({ boroCd:"301", ghostDollars: -2_000_000, perResidentPercentile: 88, population: 100000 } as any);
    expect(s).toContain("above");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/format.test.ts`
Expected: FAIL ("Cannot find module './format'").

- [ ] **Step 3: Implement formatters**

`src/lib/format.ts`:
```ts
import type { CdMetric } from "./types";
export function fmtUsd(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n/1e9).toFixed(1)}B`;
  if (a >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(n/1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}
export function fmtPct(n: number | null): string { return n == null ? "—" : `${n.toFixed(1)}%`; }
export function ghostSentence(cd: CdMetric): string {
  const under = cd.ghostDollars > 0;
  return under
    ? `If funded at citywide parity for its population, this district would have received about ${fmtUsd(cd.ghostDollars)} more — it sits in the bottom ${cd.perResidentPercentile}% of per-resident visible capital.`
    : `This district sits above parity (top ${100 - cd.perResidentPercentile}%) — about ${fmtUsd(Math.abs(cd.ghostDollars))} more than an equal-per-resident share.`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/format.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement DistrictCard**

`components/DistrictCard.tsx`:
```tsx
"use client";
import { useAtlas } from "./AtlasProvider";
import { BOROUGH_BY_DIGIT } from "@/src/lib/pipeline/cdId";
import { fmtUsd, fmtPct, ghostSentence } from "@/src/lib/format";

export function DistrictCard() {
  const { dataset, selectedCd, setSelectedCd } = useAtlas();
  if (!selectedCd) return <aside className="card empty">Click a district to see what it lost.</aside>;
  const cd = dataset.cds.find((c) => c.boroCd === selectedCd);
  if (!cd) return <aside className="card empty">No data for this district.</aside>;
  return (
    <aside className="card" aria-live="polite">
      <button className="close" onClick={()=>setSelectedCd(null)} aria-label="Close">×</button>
      <h2>{BOROUGH_BY_DIGIT[cd.boroCd[0]]} CD{parseInt(cd.boroCd.slice(1),10)}</h2>
      {cd.corridorNote && <p className="corridor">{cd.corridorNote}</p>}
      <dl>
        <div><dt>Visible capital</dt><dd>{fmtUsd(cd.visibleCapital)}</dd></div>
        <div><dt>Expected at parity</dt><dd>{fmtUsd(cd.expectedCapital)}</dd></div>
        <div><dt>Ghost dollars</dt><dd>{fmtUsd(cd.ghostDollars)}</dd></div>
        <div><dt>Per-resident rank</dt><dd>{cd.perResidentPercentile}th pct</dd></div>
        <div><dt>Population</dt><dd>{cd.population.toLocaleString()}</dd></div>
        <div><dt>Median income</dt><dd>{cd.medianHhIncome ? fmtUsd(cd.medianHhIncome) : "—"}</dd></div>
        <div><dt>% BIPOC</dt><dd>{fmtPct(cd.pctBipoc)}</dd></div>
      </dl>
      <p className="ghost-sentence">{ghostSentence(cd)}</p>
    </aside>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add components/DistrictCard.tsx src/lib/format.ts src/lib/format.test.ts
git commit -m "feat: district card with plain-language ghost sentence"
```

---

### Task 12: Dark-dollars banner + caveat component

**Files:**
- Create: `components/DarkDollarsBanner.tsx`, `components/Caveat.tsx`
- Test: `components/Caveat.test.tsx`

**Interfaces:**
- Consumes: `useAtlas` (for `dataset.meta`).
- Produces: `Caveat` (a reusable, dismissible-only-when-`locked`-is-false note — built so a future 311 layer can pass `locked`); `DarkDollarsBanner` showing `darkSharePct` + the Comptroller citation.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Caveat } from "./Caveat";

describe("Caveat", () => {
  it("renders the message", () => {
    render(<Caveat message="half the money is invisible" locked />);
    expect(screen.getByText(/invisible/)).toBeTruthy();
  });
  it("hides the dismiss control when locked", () => {
    render(<Caveat message="locked note" locked />);
    expect(screen.queryByRole("button", { name: /dismiss/i })).toBeNull();
  });
});
```

(Install testing-library: `npm install -D @testing-library/react @testing-library/jest-dom`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/Caveat.test.tsx`
Expected: FAIL ("Cannot find module './Caveat'").

- [ ] **Step 3: Implement Caveat + DarkDollarsBanner**

`components/Caveat.tsx`:
```tsx
"use client";
import { useState } from "react";
export function Caveat({ message, locked, source }: { message: string; locked: boolean; source?: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="caveat" role="note">
      <p>{message}{source && <span className="src"> — {source}</span>}</p>
      {!locked && <button onClick={()=>setHidden(true)} aria-label="Dismiss">Dismiss</button>}
    </div>
  );
}
```

`components/DarkDollarsBanner.tsx`:
```tsx
"use client";
import { useAtlas } from "./AtlasProvider";
import { fmtUsd } from "@/src/lib/format";
import { Caveat } from "./Caveat";
export function DarkDollarsBanner() {
  const { dataset: { meta } } = useAtlas();
  return (
    <div className="dark-banner">
      <strong>{meta.darkSharePct.toFixed(0)}%</strong> of capital ({fmtUsd(meta.totalDarkCapital)}) can't be placed on this map.
      <Caveat locked source="NYC Comptroller, “Flying Blind on Billions,” Dec 2025"
        message="The city's own dashboard omits roughly half its capital dollars — citywide, lump-sum, or untagged. This map shows only what the city makes visible." />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/Caveat.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/DarkDollarsBanner.tsx components/Caveat.tsx components/Caveat.test.tsx package.json
git commit -m "feat: dark-dollars banner + layer-lockable caveat component"
```

---

### Task 13: Find-your-home search + page assembly

**Files:**
- Create: `app/page.tsx`, `components/HomeSearch.tsx`, `src/lib/neighborhoods.ts`
- Test: `src/lib/neighborhoods.test.ts`

**Interfaces:**
- Consumes: all panels (Tasks 9–12), `AtlasProvider`, `loadDataset`.
- Produces: `lookupCd(query: string): string | null` mapping a neighborhood/borough phrase to a `boroCd`; the assembled single page.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { lookupCd } from "./neighborhoods";
describe("lookupCd", () => {
  it("matches a neighborhood name", () => { expect(lookupCd("jamaica")).toBe("412"); });
  it("is case-insensitive and trims", () => { expect(lookupCd("  Flushing ")).toBe("407"); });
  it("matches South Ozone Park to CD10", () => { expect(lookupCd("south ozone park")).toBe("410"); });
  it("returns null for unknown", () => { expect(lookupCd("nowheresville")).toBeNull(); });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/neighborhoods.test.ts`
Expected: FAIL ("Cannot find module './neighborhoods'").

- [ ] **Step 3: Implement neighborhood lookup**

`src/lib/neighborhoods.ts` (seed with the corridor + common names; extend later):
```ts
const MAP: Record<string, string> = {
  "jackson heights":"403","north corona":"403","corona":"404","elmhurst":"404",
  "flushing":"407","willets point":"407","jamaica":"412","st albans":"412","hollis":"412",
  "south ozone park":"410","ozone park":"410","howard beach":"410",
};
export function lookupCd(query: string): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  if (MAP[q]) return MAP[q];
  const hit = Object.keys(MAP).find((k) => k.includes(q) || q.includes(k));
  return hit ? MAP[hit] : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/neighborhoods.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement HomeSearch + assemble the page**

`components/HomeSearch.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useAtlas } from "./AtlasProvider";
import { lookupCd } from "@/src/lib/neighborhoods";
export function HomeSearch() {
  const { setSelectedCd } = useAtlas();
  const [q, setQ] = useState(""); const [miss, setMiss] = useState(false);
  const go = () => { const cd = lookupCd(q); setMiss(!cd); if (cd) setSelectedCd(cd); };
  return (
    <form className="home-search" onSubmit={(e)=>{e.preventDefault();go();}}>
      <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Find your neighborhood…" aria-label="Find your neighborhood" />
      <button type="submit">Show me</button>
      {miss && <span className="miss">Not found — try a nearby neighborhood.</span>}
    </form>
  );
}
```

`app/page.tsx` (server component loads the dataset, client provider wraps the UI):
```tsx
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Dataset } from "@/src/lib/types";
import { AtlasProvider } from "@/components/AtlasProvider";
import { MapPanel } from "@/components/MapPanel";
import { MetricToggle } from "@/components/MetricToggle";
import { PatternPanel } from "@/components/PatternPanel";
import { DistrictCard } from "@/components/DistrictCard";
import { DarkDollarsBanner } from "@/components/DarkDollarsBanner";
import { HomeSearch } from "@/components/HomeSearch";

export default async function Page() {
  const dataset: Dataset = JSON.parse(await readFile(join(process.cwd(), "public/data/cd-metrics.json"), "utf8"));
  return (
    <AtlasProvider dataset={dataset}>
      <main className="atlas">
        <header><h1>Ghost Dollars</h1><HomeSearch /></header>
        <DarkDollarsBanner />
        <section className="stage">
          <div className="map-wrap"><MetricToggle /><MapPanel /></div>
          <div className="side"><PatternPanel /><DistrictCard /></div>
        </section>
      </main>
    </AtlasProvider>
  );
}
```

- [ ] **Step 6: Verify the full app in browser**

Run: `npm run dev`. Use the verification skill / agent-browser to confirm end-to-end: page loads, dark-dollars banner shows a ~40–60% figure, searching "jamaica" opens CD12's card, clicking the map updates card + scatter highlight, metric toggle recolors. No console errors.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx components/HomeSearch.tsx src/lib/neighborhoods.ts src/lib/neighborhoods.test.ts
git commit -m "feat: find-your-home search and full page assembly"
```

---

### Task 14: Authored intro scroll

**Files:**
- Create: `components/IntroScroll.tsx`, `src/lib/introSteps.ts`
- Modify: `app/page.tsx` (mount `IntroScroll` above the stage; `app/globals.css` for layout + design language)
- Test: `src/lib/introSteps.test.ts`

**Interfaces:**
- Consumes: `useAtlas` (to drive `selectedCd`/`metric` as the user scrolls).
- Produces: `INTRO_STEPS: { boroCd: string; metric: MetricKey; headline: string; body: string }[]` (the corridor narrative beats); a scroll component that, per beat, sets the atlas state.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { INTRO_STEPS } from "./introSteps";
describe("INTRO_STEPS", () => {
  it("walks the Queens corridor in order", () => {
    expect(INTRO_STEPS.map((s)=>s.boroCd)).toEqual(["404","403","407","412","410"]);
  });
  it("each step names a metric and copy", () => {
    for (const s of INTRO_STEPS) { expect(s.headline.length).toBeGreaterThan(0); expect(["actual","perResident","ghost"]).toContain(s.metric); }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/introSteps.test.ts`
Expected: FAIL ("Cannot find module './introSteps'").

- [ ] **Step 3: Implement intro steps + scroll component**

`src/lib/introSteps.ts`:
```ts
import type { MetricKey } from "./loadData";
export const INTRO_STEPS: { boroCd: string; metric: MetricKey; headline: string; body: string }[] = [
  { boroCd:"404", metric:"actual", headline:"Corona", body:"Where the route begins — one of the densest immigrant neighborhoods in the country." },
  { boroCd:"403", metric:"perResident", headline:"Jackson Heights", body:"Per resident, the picture thins. Crowding doesn't summon investment." },
  { boroCd:"407", metric:"ghost", headline:"Flushing", body:"A proposed mega-casino at Citi Field — money the neighborhood hosts but won't keep." },
  { boroCd:"412", metric:"ghost", headline:"Jamaica", body:"Home. Read against parity, the ghost dollars come into focus." },
  { boroCd:"410", metric:"ghost", headline:"South Ozone Park", body:"Resorts World and Aqueduct sit here. The revenue leaves; the ghost dollars stay." },
];
```

`components/IntroScroll.tsx`:
```tsx
"use client";
import { useEffect, useRef } from "react";
import { useAtlas } from "./AtlasProvider";
import { INTRO_STEPS } from "@/src/lib/introSteps";
export function IntroScroll() {
  const { setSelectedCd, setMetric } = useAtlas();
  const refs = useRef<(HTMLDivElement|null)[]>([]);
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) {
        const i = Number((e.target as HTMLElement).dataset.i);
        setSelectedCd(INTRO_STEPS[i].boroCd); setMetric(INTRO_STEPS[i].metric);
      }
    }, { threshold: 0.6 });
    refs.current.forEach((r)=>r && obs.observe(r));
    return () => obs.disconnect();
  }, [setSelectedCd, setMetric]);
  return (
    <div className="intro">
      {INTRO_STEPS.map((s, i) => (
        <section key={s.boroCd} data-i={i} ref={(el)=>{refs.current[i]=el;}} className="intro-beat">
          <h2>{s.headline}</h2><p>{s.body}</p>
        </section>
      ))}
    </div>
  );
}
```

Mount it in `app/page.tsx` directly under `<header>` and above `<DarkDollarsBanner />`. Add minimal scroll/design CSS in `app/globals.css` (dark canvas, sticky map stage, ghost magenta + presence teal + signal gold accents — develop with the frontend-design skill).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/introSteps.test.ts`
Expected: PASS.

- [ ] **Step 5: Verify in browser**

Scrolling through the five beats drives the map: each beat selects its CD and sets the metric, ending on the corridor in Ghost view. Confirm no console errors.

- [ ] **Step 6: Commit**

```bash
git add components/IntroScroll.tsx src/lib/introSteps.ts app/page.tsx app/globals.css
git commit -m "feat: authored corridor intro scroll driving the map"
```

---

### Task 15: Full test pass, build, deploy

**Files:**
- Modify: `app/globals.css` (final polish), `README.md` (create)

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all unit tests PASS (cdId, demographics, capital, metrics, loadData, colorScale, regression, format, neighborhoods, introSteps, Caveat).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds with no type errors. Fix any `tsx`/type issues surfaced.

- [ ] **Step 3: Write README**

`README.md`: project summary, the dual framing, how to refresh data (`npx tsx src/lib/pipeline/fetchRaw.ts` then `npm run pipeline`), the methodology + caveats (copy the Global Constraints), and the data-source citations.

- [ ] **Step 4: Deploy to Vercel**

Use the `vercel:deploy` skill (or `vercel deploy --prod`). Confirm the deployed URL loads, the map renders, and the dark-dollars banner shows. Verify publicly accessible (no auth wall).

- [ ] **Step 5: Commit**

```bash
git add README.md app/globals.css
git commit -m "docs: README + final polish; deploy Phase 1"
```

---

## Self-Review

**Spec coverage:** Purpose/dual-framing → Tasks 6, 12. Thesis/honesty (flat baseline, percentile, consistent dark exclusion) → Tasks 5, 6, 11. Corridor → Tasks 6, 13, 14. Data sources/geography (community district, fb86-vt7u, FactFinder CSV, yfnk-k7r4) → Tasks 3, 4, 5, 7. 311 layer NOT in Phase 1 but caveat built lockable → Task 12. Methodology (visible/dark/parity/ghost/percentile) → Tasks 5, 6. Experience (intro, find-home, three cross-highlighting panels) → Tasks 9–14. Architecture (static artifacts, Next.js, MapLibre, Plot) → Tasks 1, 7, 8. Phasing/out-of-scope respected (no council allocation, no live DB, no Checkbook, no 311). Success criteria → Tasks 11 (plain sentence), 12 (dark figure unmissable), 5/6 (skeptic-proof method).

**Placeholder scan:** No TBD/TODO. The one deliberate runtime contingency — exact Dashboard field names — is handled with a recorded value in Task 3 Step 3 and an explicit "replace if different" instruction in Task 5; the sanity check in Task 7 Step 2 catches a wrong field via dark-share. Demographics CSV is a documented manual artifact, not a placeholder.

**Type consistency:** `boroCd` (3-digit string) is the join key everywhere. `MetricKey`/`OverlayKey` defined once in `loadData.ts`, reused in toggles, scatter, intro. `CdMetric`/`Dataset` defined once in `types.ts`. `getMetricValue`, `colorForValue`, `linearRegression`, `lookupCd`, `ghostSentence` signatures match across producer and consumer tasks. `CORRIDOR_NOTES` (metrics.ts) and `MAP` (neighborhoods.ts) agree on corridor codes 403/404/407/410/412.
