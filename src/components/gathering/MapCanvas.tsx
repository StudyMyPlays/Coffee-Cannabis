"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { track } from "@/lib/analytics";
import type { EventMapProps } from "./EventMap";
import styles from "./EventMap.module.css";

// Worker served from a stable path (copied by scripts/copy-map-worker.mjs).
maplibregl.setWorkerUrl(`/vendor/maplibre-gl-worker-${maplibregl.getVersion()}.mjs`);

/** Los Angeles overview when the neighborhood hasn't been announced. */
const LA_CENTER: [number, number] = [-118.3, 34.06];

/** Brand-tinted vector style on free OpenFreeMap tiles (no API key). */
function brandStyle(): StyleSpecification {
  const roads = (classes: string[], width: number, opacity: number) => ({
    type: "line" as const,
    source: "omt",
    "source-layer": "transportation",
    filter: ["in", ["get", "class"], ["literal", classes]] as unknown as maplibregl.FilterSpecification,
    paint: {
      "line-color": "#d2b578",
      "line-opacity": opacity,
      "line-width": ["interpolate", ["linear"], ["zoom"], 9, width * 0.4, 15, width * 2.4] as unknown as number,
    },
  });
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      omt: {
        type: "vector",
        url: "https://tiles.openfreemap.org/planet",
        attribution: '© <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      },
    },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": "#145024" } },
      {
        id: "park",
        type: "fill",
        source: "omt",
        "source-layer": "park",
        paint: { "fill-color": "#1a6330", "fill-opacity": 0.8 },
      },
      {
        id: "water",
        type: "fill",
        source: "omt",
        "source-layer": "water",
        paint: { "fill-color": "#0f3b1c" },
      },
      { id: "roads-minor", ...roads(["minor", "service", "tertiary"], 0.6, 0.22) },
      { id: "roads-major", ...roads(["secondary", "primary", "trunk"], 1, 0.45) },
      { id: "roads-motorway", ...roads(["motorway"], 1.4, 0.6) },
      {
        id: "places",
        type: "symbol",
        source: "omt",
        "source-layer": "place",
        filter: ["in", ["get", "class"], ["literal", ["suburb", "neighbourhood", "city", "town"]]] as unknown as maplibregl.FilterSpecification,
        layout: {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]] as unknown as string,
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 9, 10, 14, 13] as unknown as number,
          "text-transform": "uppercase",
          "text-letter-spacing": 0.18,
          "text-max-width": 8,
        },
        paint: { "text-color": "#f7eedb", "text-opacity": 0.7, "text-halo-color": "#145024", "text-halo-width": 1.2 },
      },
    ],
  };
}

export default function MapCanvas({ center, venue, onReady }: EventMapProps & { onReady: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    if (!el.current) return;
    const focus = venue ?? center;
    const map = new maplibregl.Map({
      container: el.current,
      style: brandStyle(),
      center: focus ? [focus.lng, focus.lat] : LA_CENTER,
      zoom: venue ? 14.5 : center ? 13 : 9.6,
      minZoom: 8,
      maxZoom: 17,
      attributionControl: { compact: true },
      cooperativeGestures: true, // never hijack page scroll on touch / wheel
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    let markers: maplibregl.Marker[] = [];
    if (focus) {
      const dot = document.createElement("div");
      dot.className = venue ? styles.venuePin : styles.areaPulse;
      dot.setAttribute("aria-hidden", "true");
      markers = [new maplibregl.Marker({ element: dot }).setLngLat([focus.lng, focus.lat]).addTo(map)];
    }

    let tracked = false;
    const onMove = () => {
      if (tracked) return;
      tracked = true;
      track("map_interact", { mode: venue ? "venue" : center ? "neighborhood" : "overview" });
    };
    map.on("dragstart", onMove);
    map.on("zoomstart", (e: { originalEvent?: Event }) => {
      if (e.originalEvent) onMove();
    });
    map.once("load", () => readyRef.current());
    // Tile host unreachable → keep the branded preview; never throw.
    map.on("error", () => {});

    return () => {
      markers.forEach((m) => m.remove());
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-create only when the location changes
  }, [center?.lat, center?.lng, venue?.lat, venue?.lng]);

  return <div ref={el} className={styles.canvas} role="region" aria-label="Map of the gathering neighborhood" />;
}
