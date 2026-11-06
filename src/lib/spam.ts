/**
 * Spam defenses for public forms (server-side).
 *
 * 1. Honeypot field `company` — must be empty.
 * 2. Minimum fill time — submissions < 2.5s after the form rendered are bots.
 *    Both of these return a FAKE SUCCESS so bots learn nothing.
 * 3. Sliding-window rate limit per IP + route.
 *    NOTE: in-memory and PER INSTANCE. On serverless each instance has its own
 *    window, and it resets on cold start. For a real global limit, swap
 *    `rateLimit()` for Upstash Redis (@upstash/ratelimit) or Vercel KV — the
 *    call sites only depend on the { ok, retryAfterSec } result.
 * 4. Optional Cloudflare Turnstile when TURNSTILE_SECRET_KEY is set (client
 *    sends the widget token as `turnstileToken`).
 */

export const MIN_FILL_MS = 2500;

export const RATE_LIMITS = {
  join: { limit: 5, windowMs: 10 * 60_000 },
  rsvp: { limit: 8, windowMs: 10 * 60_000 },
  rsvpCancel: { limit: 20, windowMs: 10 * 60_000 },
  adminLogin: { limit: 10, windowMs: 15 * 60_000 },
} as const;
export type RateLimitRoute = keyof typeof RATE_LIMITS;

export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value != null && value !== "";
}

/** True if the form was submitted implausibly fast (or with a bogus timestamp). */
export function isTooFast(startedAt: unknown, nowMs: number = Date.now(), minMs: number = MIN_FILL_MS): boolean {
  const t = typeof startedAt === "string" ? Number(startedAt) : startedAt;
  if (typeof t !== "number" || !Number.isFinite(t)) return false; // schema reports missing value
  if (t > nowMs + 60_000) return true; // from the future
  return nowMs - t < minMs;
}

/* ------------------------- rate limiter -------------------------------- */

const g = globalThis as unknown as { __cccRate?: Map<string, number[]> };
const MAX_KEYS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
  nowMs: number = Date.now(),
): RateLimitResult {
  g.__cccRate ??= new Map();
  const store = g.__cccRate;
  const hits = (store.get(key) ?? []).filter((t) => nowMs - t < windowMs);
  if (hits.length >= limit) {
    store.set(key, hits);
    return { ok: false, remaining: 0, retryAfterSec: Math.max(1, Math.ceil((hits[0]! + windowMs - nowMs) / 1000)) };
  }
  hits.push(nowMs);
  store.delete(key); // re-insert so Map order ≈ LRU
  store.set(key, hits);
  if (store.size > MAX_KEYS) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  return { ok: true, remaining: limit - hits.length, retryAfterSec: 0 };
}

export function rateLimitRoute(route: RateLimitRoute, ip: string, nowMs?: number): RateLimitResult {
  return rateLimit(`${route}:${ip}`, RATE_LIMITS[route], nowMs);
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim() || "unknown";
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/* ------------------------- turnstile ----------------------------------- */

export interface TurnstileResult {
  ok: boolean;
  skipped: boolean;
}

/**
 * Verify a Turnstile token if TURNSTILE_SECRET_KEY is configured.
 * Fails CLOSED on an explicit "invalid token" answer; fails OPEN (with a log)
 * if Cloudflare is unreachable, so an outage doesn't block real sign-ups.
 */
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, skipped: false };
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return { ok: data.success === true, skipped: false };
  } catch (e) {
    console.error("[spam] Turnstile verification unavailable; allowing request.", (e as Error).message);
    return { ok: true, skipped: true };
  }
}

/* ------------------------- combined screen ----------------------------- */

export type ScreenResult =
  | { action: "allow" }
  | { action: "fake-success"; reason: "honeypot" | "too-fast" }
  | { action: "rate-limited"; retryAfterSec: number }
  | { action: "challenge-failed" };

/** Run every check in order: rate limit → honeypot/fill time → Turnstile. */
export async function screenSubmission(opts: {
  route: RateLimitRoute;
  ip: string;
  body: Record<string, unknown>;
  nowMs?: number;
}): Promise<ScreenResult> {
  const now = opts.nowMs ?? Date.now();
  const rl = rateLimitRoute(opts.route, opts.ip, now);
  if (!rl.ok) return { action: "rate-limited", retryAfterSec: rl.retryAfterSec };
  if (isHoneypotTripped(opts.body.company)) return { action: "fake-success", reason: "honeypot" };
  if (isTooFast(opts.body.startedAt, now)) return { action: "fake-success", reason: "too-fast" };
  const token = typeof opts.body.turnstileToken === "string" ? opts.body.turnstileToken : undefined;
  const ts = await verifyTurnstile(token, opts.ip);
  if (!ts.ok) return { action: "challenge-failed" };
  return { action: "allow" };
}
