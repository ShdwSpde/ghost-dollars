# Ghost Dollars — Design Spec

- **Date:** 2026-06-28
- **Status:** Draft for review
- **Working title:** *Ghost Dollars* (alt: *Flying Blind*, *Dark Dollars*)
- **One line:** An interactive map that makes visible what New York City's capital-spending data leaves out — the investment immigrant neighborhoods don't get (ghost dollars) and the spending the city can't even place on a map (dark dollars).

---

## 1. Purpose

Help NYC residents *see the abstraction* hiding inside thousands of honest-looking capital line items: the structural pattern of which neighborhoods get starved of investment, read against who lives there. The phrase that drives the project — **"see what is lost in the data"** — resolves into two literal losses:

- **Ghost dollars** — the capital investment a neighborhood *did not* receive relative to an equal-per-resident baseline (the equity gap).
- **Dark dollars** — the capital the city *did* spend but cannot or will not tag to any neighborhood (the transparency gap). The NYC Comptroller's December 2025 report *"Flying Blind on Billions"* found the city's own Capital Projects Dashboard contains only ~47% of project IDs and ~58% of planned dollars present in the underlying financial system. Roughly half the money is invisible.

The tool tells both truths at once: invisible as investment, and — via a planned 311 layer — hyper-visible as suspicion.

## 2. Thesis & honesty stance

**Author's thesis (the hypothesis being tested):** Heavily immigrant, working-class POC neighborhoods in central/southeastern Queens are under-invested per capita, even as the city and state pour money into the *vice infrastructure* (casinos, racetrack) physically located in those same communities. The neighborhood hosts the externalities; the revenue flows out.

**Honesty discipline (non-negotiable):** The tool is built to let the data answer, *including the possibility that it complicates the thesis.* Dense immigrant districts sometimes score well on specific capital lines (new schools, transit) precisely because they are crowded. If the tool only confirmed the thesis it would be propaganda and no outside reviewer would trust it. Design priority: a skeptic must be unable to dismiss the method. Therefore:

- Ghost dollars are reported as **percentile rank**, not false-precision "you are owed $X."
- The **flat equal-per-resident baseline** ships first — the most conservative, hardest-to-attack version. If even that shows the tilt, it is undeniable.
- The **dark-dollars caveat is surfaced prominently**, not buried. The incompleteness is part of the story, not a footnote.

## 3. The corridor (authored spotlight)

Phase 1 maps all 59 NYC community districts. The authored intro tours a defined Queens corridor of immigrant, working-class neighborhoods bracketing the city's gambling infrastructure:

| Community District | Neighborhoods | Note |
|---|---|---|
| Queens CD3 | Jackson Heights, North Corona | author grew up here |
| Queens CD4 | Elmhurst, Corona | author grew up here |
| Queens CD7 | Flushing, Willets Point | **proposed** Metropolitan Park casino at Citi Field |
| Queens CD10 | Howard Beach, Ozone Park, South Ozone Park | **operating** Resorts World Casino + Aqueduct Racetrack; author's family |
| Queens CD12 | Jamaica, St. Albans, Hollis | author's home |

The corridor is bookended by an operating casino (CD10) and a proposed mega-casino (CD7), with immigrant neighborhoods strung between — a real spatial argument, not a vibe.

## 4. Data sources (verified 2026-06-28)

**Geography unit: NYC Community District (59).** This is both the cleanest data join (capital dollars come pre-tagged to community district; no invented spatial allocation) and the unit truest to how residents think about neighborhoods.

| Layer | Source | Dataset / endpoint | Notes |
|---|---|---|---|
| Capital spending | NYC OMB + Comptroller Capital Projects Dashboard (NYC Open Data, Socrata) | `fb86-vt7u` | Fields: `community_board`, `total_budget`, `spend_to_date`. Updated 3×/yr. **~47% complete — see §6.** |
| Demographics | NYC Population FactFinder (DCP), ACS 2019–2023 5-year | popfactfinder.planning.nyc.gov | Population, race/ethnicity, median household income, poverty rate, by CD. CSV per profile; or DCP static ACS NTA/CD profile spreadsheets for bulk. |
| CD geometry | NYC Open Data | `yfnk-k7r4` → GeoJSON export | Plain download, no key. |
| (Phase 2) Council discretionary capital | NYC Open Data | `t474-a92g` | Clean by council district; small slice (member items) — optional "elected accountability" view. |
| (Phase 2) Vice infrastructure | Manual/curated points | — | Resorts World/Aqueduct (CD10), proposed Metropolitan Park (CD7), OTB legacy sites. |
| (Phase 2) 311 | NYC Open Data 311 Service Requests | (Socrata) | Complaint-type + location → CD. Heavy interpretation caveat, see §5. |

**Access:** all Socrata endpoints are plain HTTPS, no key (free app token recommended to avoid throttling). Geometry is a plain download. FactFinder has no clean bulk API — script the per-CD CSVs or use DCP static spreadsheets.

**Denominator:** ACS total population per CD (same 2019–2023 vintage throughout; do not mix vintages).

## 5. The 311 lens (Phase 2) — designed-for, with a baked-in caveat

Raw "prostitution" / massage-establishment 311 complaints do **not** measure where sex work is. They measure **who gets reported on** — and Asian immigrant women and massage businesses are documented targets of over-reporting and racialized suspicion. Read naively, the layer is misinformation with a number attached. Read honestly, it is the sharpest "what is lost" exhibit in the project:

> **Surveillance density vs. investment density**, per capita, in the same immigrant CDs. Invisible as investment (dark dollars), hyper-visible as suspicion (311 attention).

UI requirement: the interpretation caveat is part of the layer itself and cannot be toggled off while the layer is shown, so it can never be misread as "here is where the crime is."

## 6. Methodology — ghost dollars & dark dollars

**Data-grain handling (discovered during build, 2026-06-28 — material, disclosed).** The Capital Projects Dashboard (`fb86-vt7u`) stores one row per project budget-line *per reporting period*, and republishes ~3×/yr, so each project recurs across ~9 periods. Naively summing `total_budget` over all rows over-counts capital ~10× (~$1.6T vs. the real ~$158B). Therefore:
- Use only the **latest reporting period** (the current commitment-plan snapshot; `202601` at build time, discovered dynamically).
- **Dedupe** within that period by `fms_id | budget_line` (one budget-line counted once).
- `community_board` arrives in several formats: `"Bronx 12"`, redundant `"Manhattan, Manhattan 03"`, **multi-CD** `"Manhattan 01, Manhattan 12"`, borough-only `"Brooklyn"`, and `"Citywide"`. A row is parsed into the *list* of placeable CDs it names. **Multi-CD projects split `total_budget` equally** across the listed districts (declared choice; ~3% of latest-period rows). Borough-only and Citywide name no CD → dark.

For each community district *i*:

1. **Visible capital Vᵢ** = sum of each deduped latest-period row's (possibly split) dollars assigned to CD *i*.
2. **Dark capital** = dollars on rows naming no placeable CD (`Citywide`, borough-only, empty) — **excluded** from per-capita math, **reported separately** as the transparency gap. This figure is a headline number, not a footnote.
3. **Parity baseline P** = (Σ Vᵢ over placeable CDs) ÷ (Σ populationᵢ over those CDs) → an equal-per-resident dollar figure. Labeled exactly that: a baseline, **not** an entitlement.
4. **Expected Eᵢ** = P × populationᵢ.
5. **Ghost dollars Gᵢ** = Eᵢ − Vᵢ. Positive = under parity (starved); negative = over parity.
6. **Reporting:** percentile rank of per-resident visible capital ("CD12 sits in the bottom X%"), not raw dollar entitlement.

**Baseline honesty:** Phase 1 ships *only* the flat equal-per-resident baseline (most conservative). A need-weighted baseline (older infrastructure, child population → schools) is a clearly-labeled future toggle, never the default.

**Consistency rule:** a dollar excluded as "dark" is excluded from *both* the numerator and the parity pool — never silently dropped from one side.

## 7. Experience (Phase 1)

**Opening — an authored claim, not a dashboard.** A short scroll (3–4 beats): NYC drawn plain → capital blooms as circles sized by spend → the map re-sorts by demographics and the tilt becomes visible → lands on one headline finding. The scroll follows the author's own route through the Queens corridor (Corona → Jackson Heights → Flushing → Jamaica → South Ozone Park), each CD lighting up with its ghost dollars. Then the scroll dissolves into the live tool.

**Find your home.** Type a neighborhood/address → the map re-centers on that CD and opens its card. Personal before political.

**Three coordinated panels:**
- **Map** — 59 CDs, colored by active metric. Toggle bar: *Actual $* / *Per-resident $* / **Ghost $**. Demographic overlay toggle: median income / % BIPOC / poverty rate. Dark-dollars readout always visible.
- **Pattern panel** — live scatter of per-resident capital vs. chosen demographic, regression line drawn bold. The cloud resolving into a slope *is* the abstraction. Hovering a dot highlights its CD on the map.
- **District card** — click a CD: visible capital, expected-at-parity, ghost dollars, percentile rank, demographics, plain-language sentence. Corridor CDs flagged; CD7 & CD10 note their casino.

Map ↔ scatter ↔ card all cross-highlight.

## 8. Architecture & stack

- **Frontend:** Next.js (App Router) + React, deployed on Vercel.
- **Map:** MapLibre GL (or deck.gl for the scatter-on-map blooms) with the CD GeoJSON.
- **Charts:** lightweight (e.g. Observable Plot / D3) for the scatter + regression.
- **Data store:** the joined, cleaned dataset is small (59 rows × a handful of metrics). Ship it as a **static pre-computed JSON/GeoJSON artifact** built at data-prep time — no live DB query needed for Phase 1. Supabase optional later if 311 (large) or time-series is added.
- **Data pipeline (offline, versioned scripts):** pull Dashboard `fb86-vt7u` → aggregate visible vs. dark by CD → pull FactFinder demographics by CD → join on CD id → compute parity/ghost/percentile → emit `public/data/cd-metrics.json` + merge into CD GeoJSON. Pipeline is re-runnable when the Dashboard updates (3×/yr).

**Design language:** distinctive, intentional — Du Bois data-portrait sensibility (the project's lineage), not a default dashboard. Ghost/dark dollars rendered as visible *absence* (ghosted/negative-space forms next to solid spend). To be developed with the frontend-design skill at build time.

## 9. Phasing

- **Phase 1 (ship):** Capital + demographics, all 59 CDs, flat parity baseline, ghost + dark dollars, authored corridor intro, find-your-home, three coordinated panels. Static data artifact.
- **Phase 2 (architected-for):** vice-infrastructure markers; 311 attention-vs-investment lens (with caveat); council-district discretionary-capital view; need-weighted baseline toggle; "revenue generated here vs. invested here" casino panel.

## 10. Risks & open questions

- **Completeness (primary risk):** ~47% of capital is dark. Mitigation = make it the thesis, surface prominently, never imply the visible half is the whole. Headline reasoning is "among what we can see, here's the tilt — and the city won't let us check the rest."
- **Capital window definition:** total budget vs. spend-to-date vs. current commitment plan — pick one, disclose it, keep it consistent. *(To resolve in planning.)*
- **Lump-sum/citywide leakage:** must be classed as dark, not zero. *(Pipeline detail.)*
- **FactFinder bulk friction:** no clean API; script 59 CSV pulls or use DCP static spreadsheets. *(Pipeline detail.)*
- **Multi-site / unplaceable projects:** declare handling explicitly.
- **311 misuse:** the caveat-locked-to-layer requirement (§5) is a hard guardrail, not a nicety.

## 11. Out of scope (YAGNI)

- Council-district spatial allocation of agency capital (invented allocations = the fudging we reject).
- Live database / real-time updates (data refreshes 3×/yr).
- Checkbook NYC actual-spend integration (no geography; clunky XML API).
- User accounts, saved views, comments.
- Statewide / other-borough deep dives beyond the all-59-CD base map.

## 12. Success criteria

- A resident can find their neighborhood and read, in one plain sentence, how its per-resident capital investment ranks and what its ghost dollars are.
- The dark-dollars figure is impossible to miss.
- A hostile reviewer cannot dismiss the core method (flat baseline, percentile reporting, consistent dark-dollar exclusion, cited completeness caveat).
- The Queens corridor finding is legible to someone who has never read a budget.
