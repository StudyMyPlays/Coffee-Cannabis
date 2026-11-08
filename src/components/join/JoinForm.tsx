"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { SIGNUP_CONFIG } from "@/lib/config";
import { useFieldValidation } from "@/lib/use-field-validation";
import styles from "./JoinForm.module.css";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; number?: number; existing: boolean; name: string }
  | { kind: "error"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Consent copy shown next to the checkbox.
 * LEGAL REVIEW: confirm TCPA/CAN-SPAM wording with counsel before launch.
 */
export const CONSENT_TEXT =
  "I’m 21 or older and I agree to receive emails and text messages from Coffee & Cannabis Club about gatherings, location drops and member news. Message frequency varies; message & data rates may apply. Reply STOP to opt out of texts, or unsubscribe from any email.";

/** Display split only (wording unchanged): the agreement, then the fine print. */
const CONSENT_SPLIT = CONSENT_TEXT.indexOf(". ") + 1;
const CONSENT_LEAD = CONSENT_TEXT.slice(0, CONSENT_SPLIT);
const CONSENT_FINE = CONSENT_TEXT.slice(CONSENT_SPLIT + 1);

function validate(fd: FormData): Record<string, string> {
  const e: Record<string, string> = {};
  const name = String(fd.get("name") || "").trim();
  const email = String(fd.get("email") || "").trim();
  const mobile = String(fd.get("mobile") || "").trim();
  const ig = String(fd.get("instagram") || "").trim().replace(/^@/, "");
  if (!name) e.name = "Tell us what to call you.";
  if (!EMAIL_RE.test(email)) e.email = "Enter a valid email address.";
  const digits = mobile.replace(/\D/g, "");
  if (SIGNUP_CONFIG.mobileRequired && !mobile) e.mobile = "Add a mobile number for location drops.";
  else if (mobile && (digits.length < 10 || digits.length > 15)) e.mobile = "Enter a valid mobile number.";
  if (ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig)) e.instagram = "That doesn’t look like an Instagram handle.";
  if (!fd.get("consent")) e.consent = "Please confirm you’re 21+ and agree to hear from us.";
  return e;
}

export function JoinForm({ source = "home", idPrefix = "join" }: { source?: string; idPrefix?: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const { errors, setErrors, fieldHandlers } = useFieldValidation(validate);
  const startedAt = useRef(0);
  const statusRef = useRef<HTMLDivElement>(null);
  const id = (f: string) => `${idPrefix}-${f}`;

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const focusStatus = () => requestAnimationFrame(() => statusRef.current?.focus());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const local = validate(fd);
    setErrors(local);
    if (Object.keys(local).length) {
      form.querySelector<HTMLInputElement>(`[name="${Object.keys(local)[0]}"]`)?.focus();
      track("join_error", { reason: "validation" });
      return;
    }
    setState({ kind: "submitting" });
    const name = String(fd.get("name") || "").trim();
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email: String(fd.get("email") || "").trim(),
          mobile: String(fd.get("mobile") || "").trim() || undefined,
          zip: String(fd.get("zip") || "").trim() || undefined,
          instagram: String(fd.get("instagram") || "").trim() || undefined,
          consent: fd.get("consent") === "on",
          company: String(fd.get("company") || ""),
          startedAt: startedAt.current,
          source,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 400 && data.fieldErrors) {
        setErrors(data.fieldErrors);
        setState({ kind: "idle" });
        track("join_error", { reason: "server_validation" });
        return;
      }
      if (res.status === 429) {
        setState({ kind: "error", message: "Too many tries in a short time. Give it a few minutes and try again." });
        track("join_error", { reason: "rate_limited" });
        focusStatus();
        return;
      }
      if (!res.ok || !data.ok) {
        setState({ kind: "error", message: data.message || "Something went wrong on our side. Please try again in a moment." });
        track("join_error", { reason: "server" });
        focusStatus();
        return;
      }
      const existing = data.status === "exists";
      if (!existing) track("sign_up", { method: "founding_member", source });
      setState({ kind: "success", number: data.foundingNumber, existing, name });
      form.reset();
      focusStatus();
    } catch {
      setState({ kind: "error", message: "We couldn’t reach the club. Check your connection and try again." });
      track("join_error", { reason: "network" });
      focusStatus();
    }
  }

  if (state.kind === "success") {
    return (
      <div ref={statusRef} tabIndex={-1} className={`${styles.success} state-enter`} role="status">
        <p className={styles.successKicker}>{state.existing ? "Welcome back" : "Welcome to the club"}</p>
        <p className={`display ${styles.successTitle}`}>
          {state.existing ? (
            <>You&rsquo;re already on the list, {state.name.split(" ")[0]}.</>
          ) : state.number ? (
            <>
              Founding Member <em>No.&nbsp;{String(state.number).padStart(4, "0")}</em>
            </>
          ) : (
            <>You&rsquo;re in.</>
          )}
        </p>
        <p>Watch your inbox. The next drop comes to you first.</p>
        <Link href="/#gathering" className="btn btn--ghost">
          See the next gathering
        </Link>
      </div>
    );
  }

  const err = (f: string) =>
    errors[f] ? (
      <span id={id(`${f}-err`)} className={`${styles.fieldError} state-enter`}>
        {errors[f]}
      </span>
    ) : null;
  const a11y = (f: string) => ({
    "aria-invalid": !!errors[f],
    "aria-describedby": errors[f] ? id(`${f}-err`) : undefined,
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate {...fieldHandlers}>
      <div ref={statusRef} tabIndex={-1} aria-live="polite" className={styles.status}>
        {state.kind === "error" && (
          <p className={`${styles.error} state-enter`} role="alert">
            {state.message}
          </p>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor={id("name")}>Name</label>
          <input id={id("name")} name="name" autoComplete="name" maxLength={80} required {...a11y("name")} />
          {err("name")}
        </div>
        <div className={styles.field}>
          <label htmlFor={id("email")}>Email</label>
          <input id={id("email")} name="email" type="email" inputMode="email" autoComplete="email" required {...a11y("email")} />
          {err("email")}
        </div>
        <div className={styles.field}>
          <label htmlFor={id("mobile")}>
            Mobile {!SIGNUP_CONFIG.mobileRequired && <span className={styles.opt}>Optional · for location drops</span>}
          </label>
          <input
            id={id("mobile")}
            name="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required={SIGNUP_CONFIG.mobileRequired}
            {...a11y("mobile")}
          />
          {err("mobile")}
        </div>
        <div className={styles.field}>
          <label htmlFor={id("zip")}>
            ZIP or neighborhood <span className={styles.opt}>Optional</span>
          </label>
          <input id={id("zip")} name="zip" autoComplete="postal-code" maxLength={60} {...a11y("zip")} />
          {err("zip")}
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor={id("instagram")}>
            Instagram <span className={styles.opt}>Optional</span>
          </label>
          <div className={styles.prefix}>
            <span aria-hidden="true">@</span>
            <input id={id("instagram")} name="instagram" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={31} {...a11y("instagram")} />
          </div>
          {err("instagram")}
        </div>
      </div>

      <div className={styles.hp} aria-hidden="true">
        <label htmlFor={id("company")}>Company</label>
        <input id={id("company")} name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.consent}>
        <input id={id("consent")} name="consent" type="checkbox" required {...a11y("consent")} />
        <label htmlFor={id("consent")}>
          <span className={styles.consentLead}>{CONSENT_LEAD}</span>{" "}
          <span className={styles.consentFine}>
            {CONSENT_FINE} See our <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms</Link>.
          </span>
        </label>
      </div>
      {err("consent")}

      <button
        type="submit"
        className="btn btn--block"
        disabled={state.kind === "submitting"}
        aria-busy={state.kind === "submitting"}
      >
        {state.kind === "submitting" && <span className="spinner" aria-hidden="true" />}
        {state.kind === "submitting" ? "Joining…" : "Join the club"}
      </button>
    </form>
  );
}
