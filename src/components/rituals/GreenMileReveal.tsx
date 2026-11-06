"use client";

import { useRef, useState } from "react";
import { PaisleyGlyph } from "@/components/paisley";
import { track } from "@/lib/analytics";
import type { Drink } from "@/lib/data/types";
import { DrinkDialog } from "./DrinkDialog";
import styles from "./GreenMileReveal.module.css";

const HOLD_MS = 650;

/**
 * The off-menu ritual. Revealed by pressing and holding the paisley glyph
 * (or simply clicking / pressing Enter or Space — keyboard and screen reader
 * users get the same reveal). The copy above it always states a fifth exists.
 */
export function GreenMileReveal({ drink, visual }: { drink: Drink; visual: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);
  const panelId = "green-mile-panel";

  const reveal = (method: string) => {
    if (open) return;
    setOpen(true);
    setHolding(false);
    track("green_mile_reveal", { method });
    requestAnimationFrame(() => document.getElementById(panelId)?.focus());
  };

  const startHold = (e: React.PointerEvent) => {
    if (open || e.button !== 0) return;
    setHolding(true);
    timer.current = window.setTimeout(() => reveal("long_press"), HOLD_MS);
  };
  const endHold = () => {
    setHolding(false);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.teaser}>
        <p className={styles.kicker}>Five rituals founded the club. Four are on the menu.</p>
        <button
          type="button"
          className={`${styles.glyphBtn} ${holding ? styles.holding : ""} ${open ? styles.opened : ""}`}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "The off-menu ritual is revealed below" : "Reveal the off-menu ritual"}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onContextMenu={(e) => e.preventDefault()}
          onClick={(e) => {
            // keyboard activation (detail 0) or a quick tap/click both reveal
            reveal(e.detail === 0 ? "keyboard" : "click");
          }}
        >
          <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="47" />
          </svg>
          <PaisleyGlyph className={`${styles.glyph} drift`} />
        </button>
        <p className={styles.hint} aria-hidden={open}>
          {open ? "Welcome to the inside." : "Press and hold the paisley."}
        </p>
      </div>

      <div
        id={panelId}
        className={`${styles.panel} ${open ? styles.panelOpen : ""}`}
        tabIndex={-1}
        hidden={!open}
        aria-label="Off-menu ritual"
        style={{ "--accent": drink.accent } as React.CSSProperties}
      >
        <div className={styles.visual}>{visual}</div>
        <div className={styles.copy}>
          <p className={styles.role}>Off the menu · {drink.role}</p>
          <h3 className={`display ${styles.name}`}>
            {drink.name}
            {drink.trademark && <sup>™</sup>}
          </h3>
          <p className={styles.profile}>{drink.profile}</p>
          <p>{drink.sensory}</p>
          <p className={styles.whisper}>Ask for it by name. Members know.</p>
          <DrinkDialog drink={drink} label="See the ritual">
            {visual}
          </DrinkDialog>
        </div>
      </div>
    </div>
  );
}
