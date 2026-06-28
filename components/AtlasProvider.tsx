"use client";
import { createContext, useContext, useState } from "react";
import type { Dataset } from "@/src/lib/types";
import type { MetricKey, OverlayKey } from "@/src/lib/loadData";

interface AtlasState {
  dataset: Dataset;
  metric: MetricKey; setMetric: (m: MetricKey) => void;
  overlay: OverlayKey; setOverlay: (o: OverlayKey) => void;
  selectedCd: string | null; setSelectedCd: (b: string | null) => void;
  hoverCd: string | null; setHoverCd: (b: string | null) => void;
}
const Ctx = createContext<AtlasState | null>(null);
export const useAtlas = () => { const c = useContext(Ctx); if (!c) throw new Error("AtlasProvider missing"); return c; };

export function AtlasProvider({ dataset, children }: { dataset: Dataset; children: React.ReactNode }) {
  const [metric, setMetric] = useState<MetricKey>("ghost");
  const [overlay, setOverlay] = useState<OverlayKey>("none");
  const [selectedCd, setSelectedCd] = useState<string | null>(null);
  const [hoverCd, setHoverCd] = useState<string | null>(null);
  return <Ctx.Provider value={{ dataset, metric, setMetric, overlay, setOverlay, selectedCd, setSelectedCd, hoverCd, setHoverCd }}>{children}</Ctx.Provider>;
}
