export const REFERENCE_NOTES: Record<string, string> = {
  "112": "Washington Heights — Dominican uptown",
  "110": "Central Harlem — Black cultural heart",
  "103": "Lower East Side — immigrant tenement history",
  "201": "Mott Haven / South Bronx — Puerto Rican & Dominican",
  "205": "Fordham / Grand Concourse — Latino, the Bronx's Main Street",
  "303": "Bed-Stuy — Black Brooklyn, brownstone heart",
  "308": "Crown Heights — Caribbean Brooklyn",
  "316": "Brownsville — Black Brooklyn, historically disinvested",
};

export function referenceNote(boroCd: string): string | undefined {
  return REFERENCE_NOTES[boroCd];
}
