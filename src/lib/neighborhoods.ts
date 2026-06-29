const MAP: Record<string, string> = {
  // Queens corridor
  "jackson heights":"403","north corona":"403","corona":"404","elmhurst":"404",
  "flushing":"407","willets point":"407","jamaica":"412","st albans":"412","hollis":"412",
  "south ozone park":"410","ozone park":"410","howard beach":"410",
  // Manhattan — citywide reference set
  "washington heights":"112","wash heights":"112",
  "harlem":"110","central harlem":"110",
  "lower east side":"103","les":"103",
  // Bronx — citywide reference set
  "mott haven":"201","south bronx":"201",
  "fordham":"205","grand concourse":"205",
  // Brooklyn — citywide reference set
  "bed-stuy":"303","bedford-stuyvesant":"303","bedford stuyvesant":"303",
  "crown heights":"308",
  "brownsville":"316",
};
export function lookupCd(query: string): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  if (MAP[q]) return MAP[q];
  const keys = Object.keys(MAP);
  const prefix = q.length >= 3 ? keys.find((k) => k.startsWith(q)) : undefined;
  if (prefix) return MAP[prefix];
  const contains = keys.find((k) => q.includes(k));
  return contains ? MAP[contains] : null;
}
