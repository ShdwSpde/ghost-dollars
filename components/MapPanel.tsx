"use client";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAtlas } from "./AtlasProvider";
import { getMetricValue } from "@/src/lib/loadData";
import { colorForValue } from "@/src/lib/colorScale";

// Neutral fill for features with no matching metric (park districts,
// Joint-Interest-Area geometries, etc. — ~12 of the 71 GeoJSON features).
const NO_DATA_COLOR = "#1a1a1d";

export function MapPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { dataset, metric, setSelectedCd, setHoverCd } = useAtlas();

  // Initial map mount — runs once when dataset is first available.
  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: ref.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "bg",
            type: "background",
            paint: { "background-color": "#0e0e10" },
          },
        ],
      },
      center: [-73.87, 40.71],
      zoom: 9.7,
    });
    mapRef.current = map;

    map.on("load", async () => {
      const geo = await (await fetch("/data/community-districts.geojson")).json();
      const byCd = new Map(dataset.cds.map((c) => [c.boroCd, c]));
      const values = dataset.cds.map((c) => getMetricValue(c, metric));
      const min = Math.min(...values);
      const max = Math.max(...values);

      for (const f of geo.features) {
        const cd = byCd.get(f.properties.boroCd);
        // Features without a matching CdMetric (park/JIA geometries) fall back
        // to NO_DATA_COLOR instead of crashing.
        f.properties.fill = cd
          ? colorForValue(getMetricValue(cd, metric), min, max, metric)
          : NO_DATA_COLOR;
      }

      map.addSource("cds", { type: "geojson", data: geo });
      map.addLayer({
        id: "cd-fill",
        type: "fill",
        source: "cds",
        paint: { "fill-color": ["get", "fill"], "fill-opacity": 0.85 },
      });
      map.addLayer({
        id: "cd-line",
        type: "line",
        source: "cds",
        paint: { "line-color": "#0e0e10", "line-width": 0.5 },
      });

      map.on("click", "cd-fill", (e) =>
        setSelectedCd(e.features?.[0]?.properties?.boroCd ?? null)
      );
      map.on("mousemove", "cd-fill", (e) =>
        setHoverCd(e.features?.[0]?.properties?.boroCd ?? null)
      );
      map.on("mouseleave", "cd-fill", () => setHoverCd(null));
    });
  }, [dataset]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recolor whenever the active metric changes (after initial source is loaded).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource("cds")) return;

    (async () => {
      const geo = await (await fetch("/data/community-districts.geojson")).json();
      const byCd = new Map(dataset.cds.map((c) => [c.boroCd, c]));
      const values = dataset.cds.map((c) => getMetricValue(c, metric));
      const min = Math.min(...values);
      const max = Math.max(...values);

      for (const f of geo.features) {
        const cd = byCd.get(f.properties.boroCd);
        f.properties.fill = cd
          ? colorForValue(getMetricValue(cd, metric), min, max, metric)
          : NO_DATA_COLOR;
      }

      (map.getSource("cds") as maplibregl.GeoJSONSource).setData(geo);
    })();
  }, [metric, dataset]);

  return (
    <div
      ref={ref}
      style={{ position: "absolute", inset: 0 }}
      aria-label="Community district map"
    />
  );
}
