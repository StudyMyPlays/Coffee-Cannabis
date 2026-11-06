"use client";

import Link from "next/link";
import { useRef } from "react";
import { track } from "@/lib/analytics";
import type { Drink } from "@/lib/data/types";
import styles from "./DrinkDialog.module.css";

/**
 * Optional detail modal for a drink. Uses the native <dialog> element for
 * focus trapping, Escape-to-close and inert background. Children = visual.
 */
export function DrinkDialog({ drink, children, label = "Discover the ritual" }: { drink: Drink; children: React.ReactNode; label?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = `drink-${drink.slug}-title`;

  const open = () => {
    ref.current?.showModal();
    track("drink_open", { drink: drink.slug });
  };
  const close = () => ref.current?.close();

  return (
    <>
      <button type="button" className="text-link" onClick={open} aria-haspopup="dialog">
        {label}
      </button>
      <dialog
        ref={ref}
        className={styles.dialog}
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === ref.current) close(); // backdrop click
        }}
      >
        <div className={styles.sheet} style={{ "--accent": drink.accent } as React.CSSProperties}>
          <div className={styles.visual}>{children}</div>
          <div className={styles.body}>
            <p className={styles.role}>{drink.role}</p>
            <h3 id={titleId} className={`display ${styles.name}`}>
              {drink.name}
              {drink.trademark && <sup>™</sup>}
            </h3>
            <p className={styles.profile}>{drink.profile}</p>
            <p className={styles.sensory}>{drink.sensory}</p>
            {drink.notes.length > 0 && (
              <ul className={styles.notes} aria-label="In the cup">
                {drink.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
            {drink.addOnNote && drink.legalReviewed && <p className={styles.addon}>{drink.addOnNote}</p>}
            <div className={styles.actions}>
              <Link href={`/drinks/${drink.slug}`} className="text-link">
                Full ritual
              </Link>
              <button type="button" className="btn btn--ghost" onClick={close}>
                Close
              </button>
            </div>
          </div>
          <button type="button" className={styles.x} onClick={close} aria-label="Close">
            ×
          </button>
        </div>
      </dialog>
    </>
  );
}
