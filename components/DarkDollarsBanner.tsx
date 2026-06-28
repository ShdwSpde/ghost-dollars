"use client";
import { useAtlas } from "./AtlasProvider";
import { fmtUsd } from "@/src/lib/format";
import { Caveat } from "./Caveat";
export function DarkDollarsBanner() {
  const { dataset: { meta } } = useAtlas();
  return (
    <div className="dark-banner">
      <strong>{meta.darkSharePct.toFixed(0)}%</strong> of the capital the city <em>does</em> publish ({fmtUsd(meta.totalDarkCapital)}) can't be placed in any neighborhood — it's tagged Citywide, borough-only, or lump-sum.
      <Caveat locked source="NYC Comptroller, "Flying Blind on Billions," Dec 2025"
        message="And that's only the budget the city publishes. The Comptroller found the dashboard omits ~47% of capital projects entirely. So roughly half the money never appears — and of what does, this share can't be mapped to a neighborhood." />
    </div>
  );
}
