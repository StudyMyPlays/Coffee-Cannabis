"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import type { PublicGathering } from "@/lib/data/types";
import styles from "./RsvpPanel.module.css";

type Phase =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "confirmed"; name: string }
  | { kind: "waitlist"; name: string; position?: number }
  | { kind: "duplicate"; status: string }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

interface Stored {
  token: string;
  status: "confirmed" | "waitlist";
  name: string;
}

const storeKey = (id: string) => `ccc:rsvp:${id}`;

function readStored(id: string): Stored | null {
  try {
    const raw = window.localStorage.getItem(storeKey(id));
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function writeStored(id: string, value: Stored | null) {
  try {
    if (value) window.localStorage.setItem(storeKey(id), JSON.stringify(value));
    else window.localStorage.removeItem(storeKey(id));
  } catch {
    /* storage may be unavailable (private mode) — RSVP still works via email link */
  }
}

/**
 * RSVP / waitlist for a gathering. Capacity and waitlist are enforced
 * server-side; this panel shows live counts and confirmation/cancel states.
 */
export function RsvpPanel({ gathering: initial }: { gathering: PublicGathering }) {
  const [g, setG] = useState(initial);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [stored, setStored] = useState<Stored | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const startedAt = useRef<number>(0);
  const statusRef = useRef<HTMLDivElement>(null);

  // Live counts + remembered RSVP for this device.
  useEffect(() => {
    startedAt.current = Date.now();
    setStored(readStored(initial.id));
    let alive = true;
    fetch("/api/gatherings/next", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PublicGathering | null) => {
        if (alive && data && data.id === initial.id) setG(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [initial.id]);

  const focusStatus = () => requestAnimationFrame(() => statusRef.current?.focus());

  const full = g.spotsLeft <= 0;
  const closed = g.status !== "upcoming" || Date.now() > Date.parse(g.endsAtUtc);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const local: Record<string, string> = {};
      if (!name) local.name = "Tell us what to call you.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) local.email = "Enter a valid email address.";
      setErrors(local);
      if (Object.keys(local).length) {
        form.querySelector<HTMLInputElement>(`[name="${Object.keys(local)[0]}"]`)?.focus();
        return;
      }

      setPhase({ kind: "submitting" });
      try {
        const res = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            gatheringId: g.id,
            name,
            email,
            company: String(fd.get("company") || ""),
            startedAt: startedAt.current,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 400 && data.fieldErrors) {
          setErrors(data.fieldErrors);
          setPhase({ kind: "idle" });
          return;
        }
        if (res.status === 429) {
          setPhase({ kind: "error", message: "Too many tries in a short time. Give it a few minutes and try again." });
          focusStatus();
          return;
        }
        if (!res.ok || !data.ok) {
          setPhase({
            kind: "error",
            message: data.message || "Something went wrong on our side. Please try again in a moment.",
          });
          focusStatus();
          return;
        }
        if (data.gathering) setG(data.gathering);
        if (data.status === "confirmed" || data.status === "waitlist") {
          const s: Stored = { token: data.cancelToken, status: data.status, name };
          writeStored(g.id, s);
          setStored(s);
          track(data.status === "confirmed" ? "rsvp" : "waitlist_join", { gathering: g.number });
          setPhase(
            data.status === "confirmed"
              ? { kind: "confirmed", name }
              : { kind: "waitlist", name, position: data.position },
          );
        } else {
          setPhase({ kind: "duplicate", status: data.rsvpStatus || "confirmed" });
        }
        form.reset();
        focusStatus();
      } catch {
        setPhase({ kind: "error", message: "We couldn’t reach the club. Check your connection and try again." });
        focusStatus();
      }
    },
    [g.id, g.number],
  );

  const onCancel = async () => {
    if (!stored) return;
    if (!window.confirm("Cancel your RSVP? Your spot will go to the next person on the waitlist.")) return;
    setPhase({ kind: "submitting" });
    try {
      const res = await fetch("/api/rsvp/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: stored.token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 404) throw new Error();
      if (data.gathering) setG(data.gathering);
      writeStored(g.id, null);
      setStored(null);
      track("rsvp_cancel", { gathering: g.number });
      setPhase({ kind: "cancelled" });
      focusStatus();
    } catch {
      setPhase({ kind: "error", message: "We couldn’t cancel just now. Use the link in your confirmation email, or try again." });
      focusStatus();
    }
  };

  const pct = Math.min(100, Math.round((g.attendeeCount / Math.max(1, g.capacity)) * 100));

  return (
    <div className={styles.panel}>
      <div className={styles.capacity}>
        <div className={styles.capacityRow}>
          <span>
            <strong>{g.attendeeCount}</strong> of {g.capacity} spots claimed
          </span>
          <span className={styles.capacityNote}>
            {full ? `Waitlist open${g.waitlistCount ? ` · ${g.waitlistCount} waiting` : ""}` : `${g.spotsLeft} left`}
          </span>
        </div>
        <div
          className={styles.bar}
          role="progressbar"
          aria-label="Spots claimed"
          aria-valuemin={0}
          aria-valuemax={g.capacity}
          aria-valuenow={g.attendeeCount}
        >
          <span style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
      </div>

      <div ref={statusRef} tabIndex={-1} className={styles.status} aria-live="polite">
        {phase.kind === "confirmed" && (
          <p className={styles.success}>
            <strong>You&rsquo;re in, {phase.name}.</strong> Check your inbox for confirmation. The exact location drops to
            confirmed guests before the gathering.
          </p>
        )}
        {phase.kind === "waitlist" && (
          <p className={styles.success}>
            <strong>You&rsquo;re on the waitlist{phase.position ? ` — number ${phase.position}` : ""}.</strong> If a spot
            opens, it&rsquo;s yours and we&rsquo;ll email you right away.
          </p>
        )}
        {phase.kind === "duplicate" && (
          <p className={styles.success}>
            <strong>You&rsquo;re already on the list</strong> for this gathering. Your confirmation email has the details.
          </p>
        )}
        {phase.kind === "cancelled" && <p className={styles.success}>Your RSVP is cancelled. We hope to see you at the next one.</p>}
        {phase.kind === "error" && (
          <p className={styles.error} role="alert">
            {phase.message}
          </p>
        )}
      </div>

      {stored && phase.kind !== "cancelled" ? (
        <div className={styles.have}>
          <p>
            {stored.status === "confirmed" ? "You’re confirmed" : "You’re on the waitlist"} as{" "}
            <strong>{stored.name}</strong>.
          </p>
          <button type="button" className="text-link" onClick={onCancel} disabled={phase.kind === "submitting"}>
            Cancel RSVP
          </button>
        </div>
      ) : closed ? (
        <p className={styles.closed}>RSVPs for this gathering are closed.</p>
      ) : (
        <form className={styles.form} onSubmit={onSubmit} noValidate aria-describedby="rsvp-note">
          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor="rsvp-name">Name</label>
              <input
                id="rsvp-name"
                name="name"
                autoComplete="name"
                required
                maxLength={80}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "rsvp-name-err" : undefined}
              />
              {errors.name && (
                <span id="rsvp-name-err" className={styles.fieldError}>
                  {errors.name}
                </span>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="rsvp-email">Email</label>
              <input
                id="rsvp-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "rsvp-email-err" : undefined}
              />
              {errors.email && (
                <span id="rsvp-email-err" className={styles.fieldError}>
                  {errors.email}
                </span>
              )}
            </div>
          </div>
          {/* Honeypot: hidden from people, irresistible to bots. */}
          <div className={styles.hp} aria-hidden="true">
            <label htmlFor="rsvp-company">Company</label>
            <input id="rsvp-company" name="company" tabIndex={-1} autoComplete="off" />
          </div>
          <button className="btn btn--block" type="submit" disabled={phase.kind === "submitting"}>
            {phase.kind === "submitting" ? "Saving your spot…" : full ? "Join the waitlist" : "RSVP"}
          </button>
          <p id="rsvp-note" className={styles.note}>
            21+ only. One spot per person. Not a member yet?{" "}
            <Link href="/#join">Join the club</Link> for priority RSVP.
          </p>
        </form>
      )}
    </div>
  );
}
