/**
 * Form validation (zod v4). Client-importable: no node imports, so forms can
 * pre-validate in the browser with the exact rules the API enforces.
 */
import { z } from "zod";
import { SIGNUP_CONFIG } from "./config.ts";

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

/** Lenient US-first phone normalisation → E.164 ("+1XXXXXXXXXX"). Returns null if invalid. */
export function normalizeMobile(raw: string): string | null {
  const s = raw.trim();
  if (s.startsWith("+")) {
    const digits = s.slice(1).replace(/[\s().-]/g, "");
    if (!/^\d{8,15}$/.test(digits)) return null;
    if (digits.startsWith("1") && digits.length !== 11) return null;
    return `+${digits}`;
  }
  if (/[^\d\s().-]/.test(s)) return null;
  const digits = s.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/** "@handle", "handle" or an instagram.com URL → "handle". */
export function normalizeInstagram(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "");
}

const name = z
  .string({ error: "Please tell us your name." })
  .trim()
  .min(1, { error: "Please tell us your name." })
  .max(80, { error: "Please keep your name under 80 characters." });

const email = z
  .string({ error: "Please enter your email." })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Please enter a valid email address." }));

/** Honeypot: hidden field real people never fill. */
const honeypot = z.preprocess(emptyToUndefined, z.string().max(0).optional());

const startedAt = z.coerce.number({ error: "Please reload the page and try again." }).int().positive();

const turnstileToken = z.preprocess(emptyToUndefined, z.string().max(4096).optional());

const mobileField = (required: boolean) => {
  const base = z
    .string()
    .transform((v, ctx) => {
      const n = normalizeMobile(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "Please enter a valid mobile number." });
        return z.NEVER;
      }
      return n;
    });
  return required
    ? z.preprocess(emptyToUndefined, z.string({ error: "Please enter your mobile number." }).pipe(base))
    : z.preprocess(emptyToUndefined, base.optional());
};

/** 5-digit ZIP (or ZIP+4), or a neighborhood name up to 60 chars. */
const zip = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(60, { error: "Please keep this under 60 characters." })
    .refine((v) => (/^[\d\s-]+$/.test(v) ? /^\d{5}(-\d{4})?$/.test(v) : /^[\p{L}\p{N} .,'&/-]+$/u.test(v)), {
      error: "Enter a 5-digit ZIP or your neighborhood.",
    })
    .optional(),
);

const instagram = z.preprocess(
  (v) => (typeof v === "string" ? emptyToUndefined(normalizeInstagram(v)) : v),
  z
    .string()
    .regex(/^[A-Za-z0-9._]{1,30}$/, { error: "Instagram handles use letters, numbers, periods and underscores." })
    .optional(),
);

const consent = z.preprocess(
  (v) => (v === "on" || v === "true" || v === 1 || v === "1" ? true : v),
  z.literal(true, { error: "Please confirm you'd like to hear from us." }),
);

export function makeMemberSignupSchema(opts: { mobileRequired: boolean } = SIGNUP_CONFIG) {
  return z.object({
    name,
    email,
    mobile: mobileField(opts.mobileRequired),
    zip,
    instagram,
    consent,
    source: z.preprocess(emptyToUndefined, z.string().trim().max(60).optional()),
    company: honeypot,
    startedAt,
    turnstileToken,
  });
}

export const memberSignupSchema = makeMemberSignupSchema();
export type MemberSignupFormInput = z.input<typeof memberSignupSchema>;
export type MemberSignupData = z.output<typeof memberSignupSchema>;

export const rsvpSchema = z.object({
  gatheringId: z.string({ error: "Missing gathering." }).trim().min(1, { error: "Missing gathering." }).max(100),
  name,
  email,
  company: honeypot,
  startedAt,
  turnstileToken,
});
export type RsvpFormInput = z.input<typeof rsvpSchema>;
export type RsvpData = z.output<typeof rsvpSchema>;

export const cancelTokenSchema = z.object({
  token: z.string().trim().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/),
});

/** First message per top-level field: { email: "Please enter a valid email address." }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_form";
    out[key] ??= issue.message;
  }
  return out;
}
