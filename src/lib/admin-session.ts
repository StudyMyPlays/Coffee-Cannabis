/**
 * Admin session tokens + password check (pure node:crypto; no Next imports so
 * it is unit-testable).
 *
 * Token: "<expiresAtMs>.<nonce>.<hmac>" where hmac = HMAC-SHA256 over
 * "<expiresAtMs>.<nonce>" keyed by a secret derived from ADMIN_SESSION_SECRET
 * (if set) AND the ADMIN_PASSWORD hash — so changing the password signs
 * everyone out.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ADMIN_CONFIG } from "./config.ts";

function sha256(s: string): Buffer {
  return createHash("sha256").update(s).digest();
}

function signingKey(): Buffer | null {
  const password = ADMIN_CONFIG.password;
  if (!password) return null;
  const pwHash = sha256(`ccc-admin-password:${password}`);
  const secret = ADMIN_CONFIG.sessionSecret;
  return secret ? createHmac("sha256", secret).update(pwHash).digest() : sha256(`ccc-admin-session:${pwHash.toString("hex")}`);
}

function sign(data: string, key: Buffer): string {
  return createHmac("sha256", key).update(data).digest("base64url");
}

/** Constant-time password check (compares fixed-length digests). */
export function checkAdminPassword(input: string): boolean {
  const password = ADMIN_CONFIG.password;
  if (!password || typeof input !== "string") return false;
  return timingSafeEqual(sha256(input), sha256(password));
}

export function createSessionToken(nowMs: number = Date.now()): string {
  const key = signingKey();
  if (!key) throw new Error("Admin is disabled (ADMIN_PASSWORD not set).");
  const data = `${nowMs + ADMIN_CONFIG.sessionMaxAgeSec * 1000}.${randomBytes(12).toString("base64url")}`;
  return `${data}.${sign(data, key)}`;
}

export function verifySessionToken(token: string | undefined, nowMs: number = Date.now()): boolean {
  const key = signingKey();
  if (!key || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, mac] = parts as [string, string, string];
  const expected = Buffer.from(sign(`${exp}.${nonce}`, key));
  const got = Buffer.from(mac);
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return false;
  const expMs = Number(exp);
  return Number.isFinite(expMs) && expMs > nowMs;
}
