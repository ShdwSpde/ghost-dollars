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
