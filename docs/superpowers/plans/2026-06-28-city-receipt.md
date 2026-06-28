# The City's Receipt — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a thermal-receipt UI in the DistrictCard that translates ghost dollars into tangible civic goods (school seats, lane-miles, NYCHA apartments, playgrounds) using sourced NYC unit costs.

**Architecture:** Pure function `receiptLines()` in `src/lib/civicCosts.ts` → presentational `Receipt.tsx` component (no state, no hooks) → wired into `DistrictCard.tsx` below the ghost sentence. CSS added to `app/globals.css`.

**Tech Stack:** Next.js 16 / React 19 / TypeScript / Vitest / Space Mono + design tokens already in globals.css

## Global Constraints

- Cost constants MUST use sourced figures only: `SCHOOL_SEAT=180_000`, `STREET_LANE_MILE=200_000`, `NYCHA_UNIT=485_000`, `PLAYGROUND=4_000_000`
- Receipt MUST frame all quantities as illustrative ("could fund at city unit costs") — never implies allocation
- Sources note must be visible in the receipt footer
- Only render receipt when `ghostDollars > 0`
- Space Mono for all receipt text; ~280px narrow column; torn/zigzag bottom edge; off-white paper
- TDD: failing test before implementation; vitest globals: true (no import needed for describe/it/expect)

---

### Task 1: civicCosts.ts + unit tests (TDD)

**Files:**
- Create: `src/lib/civicCosts.ts`
- Create: `src/lib/civicCosts.test.ts`

**Interfaces:**
- Produces: `interface ReceiptLine { label: string; qty: number; unit: string }` and `receiptLines(ghostDollars: number): ReceiptLine[]`

- [x] **Step 1: Write the failing test**

```ts
// src/lib/civicCosts.test.ts
import { describe, it, expect } from "vitest";
import { receiptLines } from "./civicCosts";

describe("receiptLines", () => {
  it("returns [] for 0 ghost dollars", () => {
    expect(receiptLines(0)).toEqual([]);
  });
  it("returns [] for negative ghost dollars", () => {
    expect(receiptLines(-1_000_000)).toEqual([]);
  });
  it("computes correct quantities for 360M", () => {
    const lines = receiptLines(360_000_000);
    const byLabel = Object.fromEntries(lines.map(l => [l.label, l]));
    expect(byLabel["school seats"].qty).toBe(2000);
    expect(byLabel["lane-miles repaved"].qty).toBe(1800);
    expect(byLabel["NYCHA apartments repaired"].qty).toBe(742);
    expect(byLabel["neighborhood playgrounds"].qty).toBe(90);
  });
  it("skips lines whose qty is 0", () => {
    // 100K — only street lane-mile is affordable (qty=0 for all others)
    // Actually 100K < 180K school seat, 100K < 200K lane-mile, etc — all 0
    expect(receiptLines(100_000)).toEqual([]);
  });
  it("returns only affordable items for 250K", () => {
    // 250_000 / 200_000 = 1 lane-mile; others still 0
    const lines = receiptLines(250_000);
    expect(lines).toHaveLength(1);
    expect(lines[0].label).toBe("lane-miles repaved");
    expect(lines[0].qty).toBe(1);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

```
npx vitest run src/lib/civicCosts.test.ts
```
Expected: FAIL with "Cannot find module './civicCosts'"

- [x] **Step 3: Implement civicCosts.ts**

```ts
// src/lib/civicCosts.ts

// NYC School Construction Authority, FY2025–29 Five-Year Capital Plan (March 2025)
export const SCHOOL_SEAT = 180_000;

// NYC DOT First Deputy Commissioner testimony, NYC Council Finance Committee, May 13 2025
export const STREET_LANE_MILE = 200_000;

// NYCHA 2023 Physical Needs Assessment (20-year horizon): $78.3B ÷ 161,400 units
export const NYCHA_UNIT = 485_000;

// NYC Parks Capital Project Tracker — representative neighborhood playground reconstruction
// range $3.5M–$5M; mid-range used
export const PLAYGROUND = 4_000_000;

export interface ReceiptLine {
  label: string;
  qty: number;
  unit: string;
}

const GOODS: Array<{ cost: number; label: string; unit: string }> = [
  { cost: SCHOOL_SEAT,      label: "school seats",              unit: "@ $180K/seat (SCA)" },
  { cost: STREET_LANE_MILE, label: "lane-miles repaved",        unit: "@ $200K/lane-mi (DOT)" },
  { cost: NYCHA_UNIT,       label: "NYCHA apartments repaired", unit: "@ $485K/unit (PNA 2023)" },
  { cost: PLAYGROUND,       label: "neighborhood playgrounds",  unit: "@ $4M/playground (Parks)" },
];

export function receiptLines(ghostDollars: number): ReceiptLine[] {
  if (ghostDollars <= 0) return [];
  return GOODS
    .map(({ cost, label, unit }) => ({ label, unit, qty: Math.floor(ghostDollars / cost) }))
    .filter(l => l.qty > 0);
}
```

- [x] **Step 4: Run test to verify it passes**

```
npx vitest run src/lib/civicCosts.test.ts
```
Expected: 5 tests PASS

- [x] **Step 5: Commit**

```bash
git add src/lib/civicCosts.ts src/lib/civicCosts.test.ts
git commit -m "feat: civic cost constants + receiptLines() pure function (TDD)"
```

---

### Task 2: Receipt.tsx + CSS

**Files:**
- Create: `components/Receipt.tsx`
- Modify: `app/globals.css` (append `.receipt` block)

**Interfaces:**
- Consumes: `receiptLines(ghostDollars: number): ReceiptLine[]` from `@/src/lib/civicCosts`
- Consumes: `fmtUsd(n: number): string` from `@/src/lib/format`
- Accepts prop: `cd: CdMetric` from `@/src/lib/types`
- Produces: `<Receipt cd={cd} />` (returns null when ghost <= 0)

- [x] **Step 1: Create Receipt.tsx**

No state needed — purely presentational. No "use client" directive required.

```tsx
// components/Receipt.tsx
import type { CdMetric } from "@/src/lib/types";
import { receiptLines } from "@/src/lib/civicCosts";
import { fmtUsd } from "@/src/lib/format";
import { BOROUGH_BY_DIGIT } from "@/src/lib/pipeline/cdId";

export function Receipt({ cd }: { cd: CdMetric }) {
  if (cd.ghostDollars <= 0) return null;
  const lines = receiptLines(cd.ghostDollars);
  if (lines.length === 0) return null;

  const borough = BOROUGH_BY_DIGIT[cd.boroCd[0]] ?? "NYC";
  const num = parseInt(cd.boroCd.slice(1), 10);
  const districtName = `${borough} CD${num}`;

  return (
    <div className="receipt" aria-label="Illustrative civic receipt">
      <div className="receipt-paper">
        <div className="receipt-header">
          <div className="receipt-city">CITY OF NEW YORK · UNOFFICIAL</div>
          <div className="receipt-district">{districtName}</div>
          <div className="receipt-total">{fmtUsd(cd.ghostDollars)} gap</div>
        </div>
        <div className="receipt-rule">--------------------------------</div>
        <p className="receipt-framing">
          If that gap were spent here,<br />
          at city unit costs, it could fund:
        </p>
        <div className="receipt-rule">--------------------------------</div>
        <ul className="receipt-lines">
          {lines.map((line) => (
            <li key={line.label} className="receipt-line">
              <span className="receipt-label">{line.label}</span>
              <span className="receipt-dots" aria-hidden="true" />
              <span className="receipt-qty">{line.qty.toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <div className="receipt-rule">================================</div>
        <div className="receipt-footer">*** thank you, come again ***</div>
        <div className="receipt-sources">
          Illustrative only — not earmarked funds.<br />
          Sources: NYC SCA FY25-29 · DOT May 2025 ·<br />
          NYCHA PNA 2023 · NYC Parks Capital Tracker
        </div>
        <div className="receipt-tear" aria-hidden="true" />
      </div>
    </div>
  );
}
```

- [x] **Step 2: Add CSS to app/globals.css**

Append after the last rule:

```css
/* ── City's Receipt: thermal / bodega vernacular ────────── */

.receipt {
  margin-top: 1.25rem;
}

.receipt-paper {
  font-family: var(--font-mono);
  background: #f9f6ee;
  color: #2a2a1e;
  width: 100%;
  max-width: 280px;
  padding: 1rem 0.85rem 0;
  border: 1px solid #c8c0a8;
  box-shadow: 2px 3px 8px rgba(0,0,0,0.10);
  font-size: 0.78rem;
  line-height: 1.5;
  /* slight faded-ink look */
  opacity: 0.92;
}

.receipt-header {
  text-align: center;
  margin-bottom: 0.5rem;
}

.receipt-city {
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #5a5540;
}

.receipt-district {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin: 0.2rem 0 0.1rem;
}

.receipt-total {
  font-size: 0.8rem;
  color: var(--vermilion);
  font-weight: 700;
}

.receipt-rule {
  color: #b0a890;
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  margin: 0.35rem 0;
  white-space: nowrap;
  overflow: hidden;
}

.receipt-framing {
  font-size: 0.72rem;
  color: #5a5540;
  line-height: 1.45;
  margin: 0.3rem 0;
  text-align: center;
}

.receipt-lines {
  list-style: none;
  margin: 0.3rem 0;
}

.receipt-line {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
  margin: 0.15rem 0;
}

.receipt-label {
  white-space: nowrap;
  flex-shrink: 0;
  font-size: 0.75rem;
}

.receipt-dots {
  flex: 1;
  border-bottom: 1px dotted #b0a890;
  margin: 0 0.2rem 0.15rem;
  min-width: 0.5rem;
}

.receipt-qty {
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.78rem;
}

.receipt-footer {
  text-align: center;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: #5a5540;
  margin: 0.4rem 0 0.3rem;
}

.receipt-sources {
  font-size: 0.6rem;
  color: #8a8060;
  line-height: 1.4;
  text-align: center;
  margin-bottom: 0.6rem;
}

/* Torn/zigzag bottom edge using SVG clip */
.receipt-tear {
  height: 12px;
  margin: 0 -0.85rem;
  background: var(--cream);
  clip-path: polygon(
    0% 100%, 4% 0%, 8% 100%, 12% 0%, 16% 100%, 20% 0%,
    24% 100%, 28% 0%, 32% 100%, 36% 0%, 40% 100%, 44% 0%,
    48% 100%, 52% 0%, 56% 100%, 60% 0%, 64% 100%, 68% 0%,
    72% 100%, 76% 0%, 80% 100%, 84% 0%, 88% 100%, 92% 0%,
    96% 100%, 100% 0%, 100% 100%
  );
}
```

- [x] **Step 3: Run all tests to verify nothing broke**

```
npx vitest run
```
Expected: 61+ tests PASS (civicCosts adds 5 new ones)

---

### Task 3: Wire Receipt into DistrictCard

**Files:**
- Modify: `components/DistrictCard.tsx`

- [x] **Step 1: Import and render Receipt**

Add import: `import { Receipt } from "./Receipt";`

In the return JSX of `DistrictCard`, after `<p className="ghost-sentence">...`, add:
```tsx
<Receipt cd={cd} />
```

- [x] **Step 2: Run all tests + build**

```
npx vitest run && npm run build
```
Expected: all tests green, build succeeds.

- [x] **Step 3: Commit**

```bash
git add components/Receipt.tsx app/globals.css components/DistrictCard.tsx src/lib/civicCosts.ts src/lib/civicCosts.test.ts
git commit -m "feat: The City's Receipt — translate ghost dollars into civic goods"
```

---

### Task 4: Dev server verification + screenshot

- [x] Start dev server: `pkill -f 'next dev'; npm run dev`
- [x] Playwright: navigate to http://localhost:3000, select Elmhurst/Corona district (boroCd 404), confirm receipt renders, screenshot
- [x] Write report to `.superpowers/sdd/whimsy-receipt-report.md`
