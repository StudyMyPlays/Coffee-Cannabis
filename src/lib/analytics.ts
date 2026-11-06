/**
 * Analytics facade. GA4 is loaded only when NEXT_PUBLIC_GA_ID is set
 * (see src/components/Analytics.tsx). Swap providers here without touching UI.
 */
export type AnalyticsEvent =
  | "cta_click"
  | "sign_up" // Founding Member join (GA4 recommended event)
  | "join_error"
  | "rsvp"
  | "waitlist_join"
  | "rsvp_cancel"
  | "map_interact"
  | "map_open_directions"
  | "drink_open"
  | "green_mile_reveal"
  | "share";

type Params = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: AnalyticsEvent, params: Params = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", event, params);
    }
  } catch {
    /* analytics must never break the UI */
  }
}
