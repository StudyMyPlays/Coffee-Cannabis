/**
 * Admin auth glue for Next (server-only: next/headers). Token logic lives in
 * ./admin-session.ts.
 */
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_CONFIG } from "./config.ts";
import { createSessionToken, verifySessionToken } from "./admin-session.ts";

export { checkAdminPassword, createSessionToken, verifySessionToken } from "./admin-session.ts";

export function isAdminEnabled(): boolean {
  return ADMIN_CONFIG.enabled;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!isAdminEnabled()) return false;
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_CONFIG.cookieName)?.value);
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<void> {
  if (!isAdminEnabled()) redirect("/admin");
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

export async function setAdminSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_CONFIG.cookieName, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_CONFIG.sessionMaxAgeSec,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_CONFIG.cookieName);
}

export async function requestIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
