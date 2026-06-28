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
      marginLeft: 60, marginBottom: 42, height: 320,
      style: { background: "transparent", color: "#181a2e", fontFamily: "var(--font-public-sans), system-ui, sans-serif", fontSize: "12px" },
      x: { label: LABELS[dim as keyof typeof LABELS], grid: false },
      y: { label: "Capital $ / resident", grid: true },
      marks: [
        Plot.line([{x:xmin,y:reg.slope*xmin+reg.intercept},{x:xmax,y:reg.slope*xmax+reg.intercept}], { x:"x", y:"y", stroke:"#F7B21B", strokeWidth:4 }),
        Plot.dot(points, { x: "x", y: "y", r: (d: typeof points[number])=>d.boroCd===hoverCd?8:5,
          fill: (d: typeof points[number])=>d.inCorridor?"#EA3B22":"#1E2C8C", stroke: "#181a2e", strokeWidth: 0.75,
          title: (d: typeof points[number])=>`CD ${d.boroCd}`, }),
      ],
    });
    ref.current.replaceChildren(chart);
    return () => chart.remove();
  }, [points, hoverCd, dim]);

  return (
    <div className="pattern">
      <h3>The pattern</h3>
      <div ref={ref} aria-label="Pattern scatter: per-resident capital vs demographics" />
    </div>
  );
}
