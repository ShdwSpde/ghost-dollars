# Raw data

## Files

### `capital.json`
Source: Capital Projects Dashboard (Socrata **fb86-vt7u**), fetched via:
```
https://data.cityofnewyork.us/resource/fb86-vt7u.json?$limit=50000
```
Run: `npx tsx src/lib/pipeline/fetchRaw.ts`

**Record count:** 50,000 (limit reached — may be paginated in a future iteration)

**Key fields (confirmed, used by Task 5):**
| Field | Description |
|-------|-------------|
| `community_board` | Community-board/district identifier (e.g. `"Queens 12"`, `"Citywide"`) |
| `total_budget` | Total budget in dollars as a string (e.g. `"66808000"`) |

All field names: `reporting_period`, `managing_agency`, `fms_id`, `total_budget`, `spend_to_date`, `spend_to_date_1`, `fms_project_name`, `current_phase`, `borough`, `community_board`, `budget_line`, `ten_year_plan_category`, `fms_data_date`

**Sample record:**
```json
{
  "reporting_period": "202305",
  "managing_agency": "ACS",
  "fms_id": "ACSPDF",
  "total_budget": "66808000",
  "spend_to_date": "0",
  "spend_to_date_1": "0.00",
  "fms_project_name": "Renovation projects for field offices",
  "current_phase": "(Pre-Design)",
  "borough": "Citywide",
  "community_board": "Citywide",
  "budget_line": "CS-0003",
  "ten_year_plan_category": "SOCIAL SERVICE BUILDINGS",
  "fms_data_date": "2023-05-11T00:00:00.000"
}
```

---

### `community-districts.geojson`
Source: Community Districts boundaries (Socrata **5crt-au7u**, DCP), fetched via:
```
https://data.cityofnewyork.us/api/geospatial/5crt-au7u?method=export&format=GeoJSON
```
Run: `npx tsx src/lib/pipeline/fetchRaw.ts`

**Deviation from brief:** The brief specified dataset `yfnk-k7r4`, which returned HTTP 404 (retired).
The current live dataset is `5crt-au7u` (DCP Community Districts, verified 2026-06-28, same schema, 71 features including JIAs).
The `fetchRaw.ts` script was updated to use this ID.

**Feature count:** 71 total (59 placeable CDs + 12 Joint Interest Areas / parks/airports)

**Key property:** `boro_cd` — 3-digit code (e.g. `"410"`) consistent with `cdId.ts` `normalizeCdId`.

---

### `demographics.csv`
> **REAL DATA** — ACS 2019-2023 5-year estimates (Census Bureau, released December 2024).
>
> All 59 NYC community districts sourced from the U.S. Census Bureau ACS 2023 5-year
> Summary File flat files (no Census API key required). Tables used: B01001, B03002,
> B05001, B17001, B19013, B16005. PUMA codes mapped to CDs via the 2020 Census PUMA
> Map Catalog for New York State.
>
> **Source URL:** `https://www2.census.gov/programs-surveys/acs/summary_file/2023/table-based-SF/data/5YRData/`
> **PUMA map catalog:** `https://www2.census.gov/geo/maps/DC2020/PUMA/st36_ny/Catalog_PUMAmaps_st36.pdf`
>
> **APPROXIMATION DISCLOSURE:** For NYC, 2020 PUMAs correspond 1:1 with community districts
> except for 4 pairs of CDs whose combined population falls below the 100K PUMA threshold.
> The following 8 CDs share PUMA-level data (identical values within each pair):
> - Manhattan CD1 + CD2 (PUMA 3604121)
> - Manhattan CD5 + CD6 (PUMA 3604165)
> - Bronx CD1 + CD2 (PUMA 3604221)
> - Bronx CD3 + CD6 (PUMA 3604263)

Columns (header row, one row per real CD):
```
boro_cd,population,median_hh_income,pct_bipoc,poverty_rate,foreign_born_pct,limited_english_pct
```
- `boro_cd` — 3-digit CD code (e.g. `412`)
- `population` — total population (B01001_E001)
- `median_hh_income` — median household income in dollars (B19013_E001)
- `pct_bipoc` — % BIPOC population, 0-100 (100 minus Non-Hispanic White alone share, B03002)
- `poverty_rate` — % below poverty line, 0-100 (B17001)
- `foreign_born_pct` — % foreign-born, 0-100 (B05001 E005+E006 / E001)
- `limited_english_pct` — % with limited English proficiency, 0-100 (B16005, pop 5+)

**CD count:** 59
**Vintage:** ACS 2019-2023 5-year (released December 2024)
