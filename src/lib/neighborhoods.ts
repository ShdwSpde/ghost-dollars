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
