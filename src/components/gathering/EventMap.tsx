"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/data/types";
import { track } from "@/lib/analytics";
import styles from "./EventMap.module.css";

const MapCanvas = dynamic(() => import("./MapCanvas"), { ssr: false });

export interface EventMapProps {
  neighborhood: string | null;
  center: LatLng | null;
  venue: LatLng | null;
  address: string | null;
  releaseLabel: string | null;
}

/**
 * Map preview. The heavy map library only loads once the module is near the
 * viewport; until then (or if tiles are unreachable) a branded preview shows.
 */
export function EventMap(props: EventMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => {
    setReady(true);
    setFailed(false);
  }, []);
  const onError = useCallback(() => setFailed(true), []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const directions = props.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.address)}`
    : null;

  return (
    <figure className={styles.wrap}>
      <div ref={ref} className={styles.map}>
        <div className={`${styles.preview} ${ready ? styles.hidden : ""}`} aria-hidden="true">
          {!failed && <span className={styles.pulse} />}
        </div>
        {failed && !ready && (
          <p className={`${styles.unavailable} state-enter`} role="status">
            The map couldn&rsquo;t load right now.
            <span>The neighborhood and location details are below.</span>
          </p>
        )}
        {load && <MapCanvas {...props} onReady={onReady} onError={onError} />}
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.where}>
          {props.neighborhood ? props.neighborhood : "Neighborhood: TBA"}
          {!props.neighborhood && <span className="sample-tag">Announcing soon</span>}
        </span>
        {props.address ? (
          <span className={styles.address}>
            {props.address}
            {directions && (
              <a className="text-link" href={directions} target="_blank" rel="noopener noreferrer" onClick={() => track("map_open_directions")}>
                Directions ↗
              </a>
            )}
          </span>
        ) : (
          <span className={styles.locked}>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" />
            </svg>
            Exact location drops to confirmed guests{props.releaseLabel ? ` · ${props.releaseLabel}` : " before the gathering"}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
