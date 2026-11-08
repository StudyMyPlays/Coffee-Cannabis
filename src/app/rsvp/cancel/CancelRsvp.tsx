"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { fmtLongDate, fmtTimeRange, pad2 } from "@/lib/format";
import type { PublicGathering } from "@/lib/data/types";
import { writeStoredRsvp } from "@/components/gathering/rsvp-store";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import styles from "./CancelRsvp.module.css";

type Info = { rsvp: { name: string; status: "confirmed" | "waitlist" | "cancelled"; position: number | null }; gathering: PublicGathering | null };
type State =
  | { kind: "loading" }
  | { kind: "invalid"; message: string; retryable: boolean }
  | { kind: "ready"; info: Info }
  | { kind: "working"; info: Info }
  | { kind: "done" }
  | { kind: "error"; info: Info; message: string };

const MISSING_TOKEN = "This link is missing its token. Use the link from your confirmation email.";

/** Looks up the RSVP behind a cancel token and returns the state to show. */
async function fetchStatus(token: string, signal?: AbortSignal): Promise<State> {
  try {
    const r = await fetch(`/api/rsvp/status?token=${encodeURIComponent(token)}`, { cache: "no-store", signal });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.ok) return { kind: "invalid", message: data.message || "That link isn’t valid.", retryable: r.status >= 500 };
    return { kind: "ready", info: data };
  } catch {
    return { kind: "invalid", message: "We couldn’t reach the club. Try again in a moment.", retryable: true };
  }
}

export function CancelRsvp({ token }: { token: string }) {
  const [state, setState] = useState<State>(
    token ? { kind: "loading" } : { kind: "invalid", message: MISSING_TOKEN, retryable: false },
  );

  useEffect(() => {
    if (!token) return;
    const ctrl = new AbortController();
    fetchStatus(token, ctrl.signal).then((next) => {
      if (!ctrl.signal.aborted) setState(next);
    });
    return () => ctrl.abort();
  }, [token]);

  if (state.kind === "loading")
    return (
      <LoadingRegion label="Finding your RSVP…" className={styles.stack}>
        <Skeleton width="min(22rem, 90%)" height="0.8em" />
        <Skeleton width="85%" height="var(--step-3)" />
        <Skeleton width="11rem" height="52px" radius="var(--radius-pill)" />
      </LoadingRegion>
    );

  if (state.kind === "invalid")
    return (
      <div className={`${styles.stack} state-enter`}>
        <p className={styles.alert} role="alert">
          {state.message}
        </p>
        <div className={styles.actions}>
          {state.retryable && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setState({ kind: "loading" });
                fetchStatus(token).then(setState);
              }}
            >
              Try again
            </button>
          )}
          <Link href="/#gathering" className={state.retryable ? "btn btn--ghost" : "btn"}>
            See the next gathering
          </Link>
          <Link href="/" className="text-link">
            Back to the club
          </Link>
        </div>
      </div>
    );

  if (state.kind === "done")
    return (
      <div role="status" className={`${styles.stack} state-enter`}>
        <p className={`display ${styles.title}`}>Your RSVP is cancelled.</p>
        <p className="muted">Thanks for letting us know. Your spot goes to the next person on the waitlist.</p>
        <Link href="/" className="btn btn--ghost">
          Back to the club
        </Link>
      </div>
    );

  const { info } = state;
  const g = info.gathering;
  const working = state.kind === "working";
  const cancel = async () => {
    setState({ kind: "working", info });
    try {
      const r = await fetch("/api/rsvp/cancel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data.message);
      track("rsvp_cancel", { gathering: g?.number ?? null, source: "email_link" });
      if (g) writeStoredRsvp(g.id, null);
      setState({ kind: "done" });
    } catch (e) {
      setState({ kind: "error", info, message: (e as Error).message || "We couldn’t cancel just now. Please try again." });
    }
  };

  return (
    <div className={`${styles.stack} state-enter`}>
      {g && (
        <p className="eyebrow">
          Gathering No. {pad2(g.number)} · {fmtLongDate(g.startsAtUtc)} · {fmtTimeRange(g.startsAtUtc, g.endsAtUtc)}
        </p>
      )}
      <p className={`display ${styles.title}`}>
        {info.rsvp.status === "cancelled"
          ? "This RSVP is already cancelled."
          : info.rsvp.status === "waitlist"
            ? `${info.rsvp.name}, you’re on the waitlist${info.rsvp.position ? ` (number ${info.rsvp.position})` : ""}.`
            : `${info.rsvp.name}, you’re confirmed.`}
      </p>
      {state.kind === "error" && (
        <p className={`${styles.alert} state-enter`} role="alert">
          {state.message}
        </p>
      )}
      {info.rsvp.status !== "cancelled" && (
        <button type="button" className="btn" onClick={cancel} disabled={working} aria-busy={working}>
          {working && <span className="spinner" aria-hidden="true" />}
          {working ? "Cancelling…" : "Cancel my RSVP"}
        </button>
      )}
      <Link href="/" className="text-link">
        Back to the club
      </Link>
    </div>
  );
}
