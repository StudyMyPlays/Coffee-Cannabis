"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { fmtLongDate, fmtTimeRange, pad2 } from "@/lib/format";
import type { PublicGathering } from "@/lib/data/types";

type Info = { rsvp: { name: string; status: "confirmed" | "waitlist" | "cancelled"; position: number | null }; gathering: PublicGathering | null };
type State = { kind: "loading" } | { kind: "invalid"; message: string } | { kind: "ready"; info: Info } | { kind: "working"; info: Info } | { kind: "done" } | { kind: "error"; info: Info; message: string };

export function CancelRsvp({ token }: { token: string }) {
  const [state, setState] = useState<State>(token ? { kind: "loading" } : { kind: "invalid", message: "This link is missing its token. Use the link from your confirmation email." });

  useEffect(() => {
    if (!token) return;
    fetch(`/api/rsvp/status?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.ok) setState({ kind: "invalid", message: data.message || "That link isn’t valid." });
        else setState({ kind: "ready", info: data });
      })
      .catch(() => setState({ kind: "invalid", message: "We couldn’t reach the club. Try again in a moment." }));
  }, [token]);

  if (state.kind === "loading") return <p role="status">Finding your RSVP…</p>;
  if (state.kind === "invalid") return <p role="alert">{state.message}</p>;
  if (state.kind === "done")
    return (
      <div role="status" style={{ display: "grid", gap: "var(--space-4)", justifyItems: "start" }}>
        <p className="display" style={{ fontSize: "var(--step-3)" }}>Your RSVP is cancelled.</p>
        <p className="muted">Thanks for letting us know. Your spot goes to the next person on the waitlist.</p>
        <Link href="/" className="btn btn--ghost">Back to the club</Link>
      </div>
    );

  const { info } = state;
  const g = info.gathering;
  const cancel = async () => {
    setState({ kind: "working", info });
    try {
      const r = await fetch("/api/rsvp/cancel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data.message);
      track("rsvp_cancel", { gathering: g?.number ?? null, source: "email_link" });
      try {
        if (g) window.localStorage.removeItem(`ccc:rsvp:${g.id}`);
      } catch {}
      setState({ kind: "done" });
    } catch (e) {
      setState({ kind: "error", info, message: (e as Error).message || "We couldn’t cancel just now. Please try again." });
    }
  };

  return (
    <div style={{ display: "grid", gap: "var(--space-4)", justifyItems: "start" }}>
      {g && (
        <p className="eyebrow">
          Gathering No. {pad2(g.number)} · {fmtLongDate(g.startsAtUtc)} · {fmtTimeRange(g.startsAtUtc, g.endsAtUtc)}
        </p>
      )}
      <p className="display" style={{ fontSize: "var(--step-3)" }}>
        {info.rsvp.status === "cancelled"
          ? "This RSVP is already cancelled."
          : info.rsvp.status === "waitlist"
            ? `${info.rsvp.name}, you’re on the waitlist${info.rsvp.position ? ` (number ${info.rsvp.position})` : ""}.`
            : `${info.rsvp.name}, you’re confirmed.`}
      </p>
      {state.kind === "error" && <p role="alert">{state.message}</p>}
      {info.rsvp.status !== "cancelled" && (
        <button type="button" className="btn" onClick={cancel} disabled={state.kind === "working"}>
          {state.kind === "working" ? "Cancelling…" : "Cancel my RSVP"}
        </button>
      )}
      <Link href="/" className="text-link">Back to the club</Link>
    </div>
  );
}
