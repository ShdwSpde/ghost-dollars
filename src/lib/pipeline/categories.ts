/**
 * DISCLOSED capital classification by managing_agency.
 *
 * Basis: the 25 managing_agency values actually present in data/raw/capital.json
 * (extracted from the 202601 reporting period). This is a coarse split by the
 * agency that owns the budget line — NOT a precise per-project determination.
 *
 * Neighborhood-serving: K-12 schools, parks, libraries, housing, local health &
 * social services, local fire/police/sanitation facilities.
 *
 * Citywide/regional: economic development, streets & bridges, water & sewer
 * infrastructure, major administrative/tech, higher education, correction.
 *
 * Any agency not in this table is returned as "other" so unknowns remain visible.
 *
 * Full mapping + dollar shares documented in
 * .superpowers/sdd/v2-categories-report.md
 */

export const AGENCY_BUCKET: Record<string, "neighborhood" | "citywide"> = {
  // ── Neighborhood-serving ──────────────────────────────────────────────────
  ACS:   "neighborhood", // Administration for Children's Services — local child services
  BPL:   "neighborhood", // Brooklyn Public Library
  DCLA:  "neighborhood", // Dept. of Cultural Affairs — local cultural venues & institutions
  DFTA:  "neighborhood", // Dept. for the Aging (AGING/DFTA)
  DHS:   "neighborhood", // Dept. of Homeless Services — local shelter facilities
  DOE:   "neighborhood", // Dept. of Education — K-12 schools
  DOHMH: "neighborhood", // Dept. of Health & Mental Hygiene — local clinics & health facilities
  DPR:   "neighborhood", // Dept. of Parks & Recreation
  DSNY:  "neighborhood", // Dept. of Sanitation — local garages, depots & facilities
  FDNY:  "neighborhood", // Fire Dept. — local firehouses
  HHC:   "neighborhood", // NYC Health + Hospitals — local hospital campuses
  HPD:   "neighborhood", // Housing Preservation & Development — affordable housing
  HRA:   "neighborhood", // Human Resources Administration — local social service sites
  NYPD:  "neighborhood", // Police Dept. — local precincts
  NYPL:  "neighborhood", // New York Public Library (Manhattan, Bronx, Staten Island)
  NYRL:  "neighborhood", // New York Reference Library — library system
  QPL:   "neighborhood", // Queens Public Library

  // ── Citywide / regional ───────────────────────────────────────────────────
  CUNY:  "citywide",     // City University of New York — citywide higher-education system
  DCAS:  "citywide",     // Dept. of Citywide Administrative Services — central facilities & fleet
  DDC:   "citywide",     // Dept. of Design & Construction — major infrastructure construction
  DEP:   "citywide",     // Dept. of Environmental Protection — water supply & sewer infrastructure
  DOC:   "citywide",     // Dept. of Correction — citywide jail system (Rikers + borough)
  DOT:   "citywide",     // Dept. of Transportation — streets, bridges & traffic systems
  EDC:   "citywide",     // Economic Development Corporation — economic development projects
  OTI:   "citywide",     // Office of Technology & Innovation (formerly DoITT) — citywide tech
};

export type Bucket = "neighborhood" | "citywide" | "other";

/**
 * Map a managing_agency string to a bucket.
 * Normalizes to uppercase before lookup; returns "other" if not in the table.
 */
export function bucketForAgency(agency: string): Bucket {
  const key = agency.trim().toUpperCase();
  return AGENCY_BUCKET[key] ?? "other";
}
