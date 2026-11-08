/**
 * The RSVP remembered on this device, kept in localStorage and exposed to React
 * through useSyncExternalStore: no hydration mismatch (the server snapshot is
 * always null) and every open tab stays in sync via the `storage` event.
 */
import { useSyncExternalStore } from "react";

export interface StoredRsvp {
  token: string;
  status: "confirmed" | "waitlist";
  name: string;
}

const LOCAL_EVENT = "ccc:rsvp-change";
export const rsvpStoreKey = (gatheringId: string) => `ccc:rsvp:${gatheringId}`;

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // storage unavailable (private mode): RSVP still works via email link
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCAL_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCAL_EVENT, onChange);
  };
}

const parseCache = new Map<string, StoredRsvp | null>();
function parse(raw: string | null): StoredRsvp | null {
  if (!raw) return null;
  if (!parseCache.has(raw)) {
    try {
      parseCache.set(raw, JSON.parse(raw) as StoredRsvp);
    } catch {
      parseCache.set(raw, null);
    }
  }
  return parseCache.get(raw) ?? null;
}

export function useStoredRsvp(gatheringId: string): StoredRsvp | null {
  const key = rsvpStoreKey(gatheringId);
  // The raw string is a stable snapshot; parsing is memoised per value.
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
  return parse(raw);
}

export function writeStoredRsvp(gatheringId: string, value: StoredRsvp | null) {
  try {
    const key = rsvpStoreKey(gatheringId);
    if (value) window.localStorage.setItem(key, JSON.stringify(value));
    else window.localStorage.removeItem(key);
  } catch {
    /* storage may be unavailable (private mode) */
  }
  window.dispatchEvent(new Event(LOCAL_EVENT));
}
