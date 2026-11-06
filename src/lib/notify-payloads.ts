/** Payload builders for notify() — keep event shapes consistent everywhere. */
import type { Gathering, Rsvp } from "./data/types.ts";
import { SITE_URL } from "./config.ts";
import { formatLaDate, formatLaTimeRange, laWallTimeToUtc } from "./time.ts";

export function cancelUrl(token: string): string {
  return `${SITE_URL}/rsvp/cancel?token=${encodeURIComponent(token)}`;
}

/** Non-private gathering summary for message templates. */
export function gatheringSummary(g: Gathering) {
  const start = laWallTimeToUtc(g.startsAt);
  const end = laWallTimeToUtc(g.endsAt);
  return {
    id: g.id,
    slug: g.slug,
    number: g.number,
    title: g.title,
    neighborhood: g.neighborhood ?? "TBA",
    startsAtUtc: start.toISOString(),
    endsAtUtc: end.toISOString(),
    dateLabel: formatLaDate(start, { format: "date" }),
    timeLabel: formatLaTimeRange(start, end),
    url: `${SITE_URL}/`,
  };
}

export function rsvpPayload(rsvp: Rsvp, g: Gathering, extra: Record<string, unknown> = {}) {
  return {
    to: { name: rsvp.name, email: rsvp.email },
    rsvp: { id: rsvp.id, status: rsvp.status, createdAt: rsvp.createdAt },
    cancelUrl: cancelUrl(rsvp.cancelToken),
    gathering: gatheringSummary(g),
    ...extra,
  };
}

/** Location drop: the one message that intentionally carries the address. */
export function locationDropPayload(g: Gathering, recipients: Rsvp[]) {
  return {
    gathering: gatheringSummary(g),
    address: g.address,
    venueLocation: g.venueLocation,
    mapUrl: g.venueLocation
      ? `https://www.google.com/maps/search/?api=1&query=${g.venueLocation.lat},${g.venueLocation.lng}`
      : g.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.address)}`
        : null,
    recipients: recipients.map((r) => ({ name: r.name, email: r.email, cancelUrl: cancelUrl(r.cancelToken) })),
  };
}

export function broadcastRecipients(rsvps: Rsvp[], statuses: Rsvp["status"][] = ["confirmed"]) {
  return rsvps
    .filter((r) => statuses.includes(r.status))
    .map((r) => ({ name: r.name, email: r.email, status: r.status, cancelUrl: cancelUrl(r.cancelToken) }));
}
