"use client";
import { useEffect, useRef, useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { useAtlas } from "./AtlasProvider";
import { linearRegression } from "@/src/lib/regression";
import type { OverlayKey } from "@/src/lib/loadData";

const LABELS: Record<Exclude<OverlayKey,"none">, string> = {
  medianHhIncome: "Median household income ($)", pctBipoc: "% BIPOC", povertyRate: "Poverty rate (%)",
};
export function PatternPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const { dataset, overlay, hoverCd } = useAtlas();
  const dim = overlay === "none" ? "pctBipoc" : overlay;
  const points = useMemo(() => dataset.cds
    .filter((c) => c[dim] != null && c.population > 0)
    .map((c) => ({ x: c[dim] as number, y: c.perResidentCapital, boroCd: c.boroCd, inCorridor: c.inCorridor })), [dataset, dim]);

  useEffect(() => {
    if (!ref.current) return;
    const reg = linearRegression(points);
    const xs = points.map((p) => p.x);
    const xmin = Math.min(...xs), xmax = Math.max(...xs);
    const chart = Plot.plot({
      marginLeft: 60, height: 320,
      x: { label: LABELS[dim as keyof typeof LABELS] }, y: { label: "Capital $ / resident" },
      marks: [
        Plot.dot(points, { x: "x", y: "y", r: (d: typeof points[number])=>d.boroCd===hoverCd?7:4, fill: (d: typeof points[number])=>d.inCorridor?"#b03a6e":"#3f9690",
          title: (d: typeof points[number])=>`CD ${d.boroCd}`, }),
        Plot.line([{x:xmin,y:reg.slope*xmin+reg.intercept},{x:xmax,y:reg.slope*xmax+reg.intercept}], { x:"x", y:"y", stroke:"#e2b13c", strokeWidth:2 }),
      ],
    });
    ref.current.replaceChildren(chart);
    return () => chart.remove();
  }, [points, hoverCd, dim]);

  return <div ref={ref} aria-label="Pattern scatter: per-resident capital vs demographics" />;
}
