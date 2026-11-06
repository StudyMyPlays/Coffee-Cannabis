/**
 * Site configuration. Client-safe: no node-only imports. Only NEXT_PUBLIC_*
 * variables are inlined into browser bundles; anything else read here is
 * `undefined` in the browser (server-only values are exposed as functions so
 * they are always read at call time on the server).
 */

function stripSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return stripSlash(explicit);
  // Vercel exposes the production domain (without scheme) on the server, and
  // as NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL to the browser bundle.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return stripSlash(`https://${vercel.replace(/^https?:\/\//, "")}`);
  return "http://localhost:3000";
}

/** Resolved canonical site URL, no trailing slash. */
export const SITE_URL: string = resolveSiteUrl();

export const SITE_NAME = "Coffee & Cannabis Club";

export interface SocialLink {
  url: string;
  handle: string;
  /** TODO: true until the real handle is confirmed — UI may hide or label it. */
  isPlaceholder: boolean;
}

// TODO(team): replace with the real handles, then set isPlaceholder: false.
export const SOCIAL: { instagram: SocialLink; tiktok: SocialLink } = {
  instagram: { url: "https://instagram.com/", handle: "@TODO", isPlaceholder: true },
  tiktok: { url: "https://www.tiktok.com/", handle: "@TODO", isPlaceholder: true },
};

// TODO(team): replace with the real contact inbox, then set isPlaceholder: false.
export const CONTACT: { email: string; isPlaceholder: boolean } = {
  email: "hello@example.com",
  isPlaceholder: true,
};

export const SIGNUP_CONFIG: { mobileRequired: boolean } = {
  mobileRequired: process.env.NEXT_PUBLIC_MOBILE_REQUIRED === "true",
};

/** Server-side admin settings. Always read lazily; never inlined client-side. */
export const ADMIN_CONFIG = {
  cookieName: "ccc_admin",
  sessionMaxAgeSec: 12 * 60 * 60,
  get password(): string | undefined {
    return process.env.ADMIN_PASSWORD || undefined;
  },
  get sessionSecret(): string | undefined {
    return process.env.ADMIN_SESSION_SECRET || undefined;
  },
  get enabled(): boolean {
    return Boolean(process.env.ADMIN_PASSWORD);
  },
};
