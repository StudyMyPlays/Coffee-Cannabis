"use client";

import { useEffect, useState } from "react";
import { pad2 } from "@/lib/format";
import { getCountdown } from "@/lib/time";
import styles from "./Countdown.module.css";

function Unit({ value, label }: { value: number; label: string }) {
  const v = label === "Days" ? String(value).padStart(2, "0") : pad2(value);
  return (
    <div className={styles.unit}>
      <span className={styles.value}>
        {/* keyed so each change re-triggers the tick animation */}
        <span key={v} className={styles.digits} suppressHydrationWarning>
          {v}
        </span>
      </span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export function Countdown({ startsAtUtc, endsAtUtc, initialNow }: { startsAtUtc: string; endsAtUtc: string; initialNow: number }) {
  const target = Date.parse(startsAtUtc);
  const end = Date.parse(endsAtUtc);
  const [now, setNow] = useState(initialNow);

  // Subscribe to the clock. The first tick runs on the next frame so a stale
  // server-rendered time is corrected right after hydration.
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick);
    const id = window.setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, []);

  const p = getCountdown(target, now);
  const live = p.isPast && now < end;
  const summary = p.isPast
    ? live
      ? "The gathering is happening now."
      : "This gathering has ended."
    : `${p.days} days, ${p.hours} hours and ${p.minutes} minutes to go.`;

  if (p.isPast) {
    return (
      <div className={styles.done} role="status">
        <span className={styles.liveDot} aria-hidden="true" />
        {live ? "Happening now" : "This gathering has ended"}
      </div>
    );
  }

  return (
    <div className={styles.countdown}>
      <div className={styles.units} aria-hidden="true">
        <Unit value={p.days} label="Days" />
        <span className={styles.sep}>:</span>
        <Unit value={p.hours} label="Hours" />
        <span className={styles.sep}>:</span>
        <Unit value={p.minutes} label="Min" />
        <span className={styles.sep}>:</span>
        <Unit value={p.seconds} label="Sec" />
      </div>
      {/* Screen readers get a calm, minute-level summary instead of per-second noise. */}
      <p className="sr-only" suppressHydrationWarning>
        {summary}
      </p>
    </div>
  );
}
