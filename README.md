# Ghost Dollars

An interactive map that makes visible what New York City's capital-spending data leaves out: the investment immigrant neighborhoods don't get, and the spending the city can't place on a map.

## The Two Framings

**Ghost dollars: the equity gap.** For each of NYC's 59 community districts, ghost dollars represent the capital investment a neighborhood *did not* receive relative to an equal-per-resident baseline. A positive ghost-dollar figure means the district received less than its population-proportional share of visible capital. The tool reports this as a percentile rank (not a false-precision dollar entitlement) to make the comparative tilt legible without overstating precision.

**Dark dollars: two transparency gaps that compound.** There is no single dark-dollars number. There are two separate, stacking gaps, and the tool is careful never to conflate them:

1. **Unplaceable share (computed here, ~74%):** Of the capital the city *does* publish in the Capital Projects Dashboard, roughly $116B of $158B (the current commitment plan) is tagged `Citywide`, borough-only, or lump-sum, so it names no community district. This is our computed `darkSharePct`. These dollars exist in the public record but cannot be assigned to any neighborhood.

2. **Missing share (NYC Comptroller, *"Flying Blind on Billions,"* Dec 2025, ~47%):** The dashboard contains only about 47% of project IDs and ~58% of planned dollars present in the city's underlying financial system. Roughly half of projects never appear in the public-facing data at all.

These stack: of all capital, roughly half never reaches the dashboard, and of what does, roughly three-quarters can't be placed in a neighborhood. The tool presents #1 as its own measured number and cites #2 as a separate, compounding fact.

## Methodology & Caveats

**Reporting period:** The pipeline uses only the latest reporting period (`202601` at build time, discovered dynamically from the dataset). The Capital Projects Dashboard stores one row per project budget-line per reporting period and republishes ~3× per year, so naively summing all rows overstates capital ~10×. We deduplicate within the latest period by `fms_id | budget_line`.

**Deduplication:** One budget-line per project is counted once per the latest reporting period.

**Multi-CD projects:** A small fraction (~3%) of rows name more than one community district (e.g. `"Manhattan 01, Manhattan 12"`). These projects split `total_budget` equally across the listed districts. Borough-only and Citywide rows are classified as dark.

**Parity baseline:** A flat equal-per-resident dollar figure: (sum of all placeable visible capital) ÷ (sum of all placeable-CD populations). It is the most conservative baseline, and the simplest to read and to defend. A need-weighted baseline is a planned future toggle, never the default.

**Percentile reporting:** Per-resident visible capital is ranked across all 59 CDs and reported as a percentile. Ghost dollars are shown for orientation, not as a precise entitlement claim.

**PUMA approximation:** ACS 2019–2023 5-year population data is sourced via a PUMA-to-CD crosswalk. For 8 community districts with population under 100,000, the PUMA boundaries do not align cleanly with CD boundaries, so population figures are approximations for those districts.

**Dark-dollar consistency:** A dollar excluded as dark is excluded from *both* the numerator (visible capital per CD) and the parity pool. It is never silently dropped from one side.

## Data Sources

| Layer | Source | Dataset ID | Notes |
|---|---|---|---|
| Capital spending | NYC Capital Projects Dashboard (NYC Open Data / Socrata) | `fb86-vt7u` | Fields: `community_board`, `total_budget`, `spend_to_date`. Updated ~3×/yr. |
| Demographics | ACS 2019–2023 5-year, via PUMA-to-CD crosswalk | — | Population, race/ethnicity, median household income by CD. PUMA approximation disclosed above. |
| CD geometry | NYC Open Data | `5crt-au7u` | GeoJSON export, plain download. (Was `yfnk-k7r4`, retired 2024.) |

## Refreshing Data

1. Fetch raw capital data:
   ```
   npx tsx src/lib/pipeline/fetchRaw.ts
   ```
2. Run the full pipeline (aggregate, deduplicate, join demographics, compute metrics):
   ```
   npm run pipeline
   ```
   This overwrites `public/data/cd-metrics.json` and the merged GeoJSON.

## Running Locally

```
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Tests:
```
npx vitest run
```
