const MAP: Record<string, string> = {
  "jackson heights":"403","north corona":"403","corona":"404","elmhurst":"404",
  "flushing":"407","willets point":"407","jamaica":"412","st albans":"412","hollis":"412",
  "south ozone park":"410","ozone park":"410","howard beach":"410",
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
