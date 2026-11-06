/**
 * Outbound notifications (server-only: uses node:crypto).
 *
 * notify(event, payload) never throws. If NOTIFY_WEBHOOK_URL is set, it POSTs
 *   { event, payload, sentAt }
 * as JSON, with header `x-ccc-signature: sha256=<hex HMAC-SHA256 of the raw
 * body using NOTIFY_WEBHOOK_SECRET>` (omitted if no secret). Otherwise the
 * event is logged.
 *
 * Connecting a provider — point NOTIFY_WEBHOOK_URL at any of:
 * - Zapier / Make: "Catch Hook" trigger → branch on `event` → Gmail/Resend/
 *   Twilio/Klaviyo steps. Fastest no-code path.
 * - Resend (email): a small route or edge function that verifies the
 *   signature, then `resend.emails.send({ to: payload.to.email, ... })` with a
 *   template per event. Or call Resend directly inside `deliver()` below.
 * - Twilio (SMS): same pattern with `client.messages.create` for members who
 *   gave a mobile number (Member.mobile is E.164).
 * - Klaviyo: send each event as a Klaviyo "metric" (Events API) and build
 *   flows there; profile = payload.to.email.
 * Verify signatures by recomputing HMAC-SHA256(rawBody, secret) and comparing
 * with a constant-time compare.
 */
import { createHmac } from "node:crypto";

export type NotifyEvent =
  | "member.welcome"
  | "rsvp.confirmed"
  | "rsvp.waitlisted"
  | "rsvp.promoted"
  | "rsvp.cancelled"
  | "gathering.location_drop"
  | "gathering.reminder"
  | "gathering.updated";

export interface Recipient {
  name: string;
  email: string;
}

export interface NotifyResult {
  delivered: boolean;
  mode: "webhook" | "log";
  status?: number;
  error?: string;
}

export function signPayload(body: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

export async function notify(event: NotifyEvent, payload: Record<string, unknown>): Promise<NotifyResult> {
  try {
    const url = process.env.NOTIFY_WEBHOOK_URL;
    const body = JSON.stringify({ event, payload, sentAt: new Date().toISOString() });

    if (!url) {
      if (process.env.NODE_ENV !== "production") {
        console.info(`[notify] ${event} (no NOTIFY_WEBHOOK_URL; logged only)\n${body}`);
      } else {
        console.info(`[notify] ${event} not delivered: NOTIFY_WEBHOOK_URL is not configured.`);
      }
      return { delivered: false, mode: "log" };
    }

    const headers: Record<string, string> = { "content-type": "application/json", "user-agent": "ccc-notify/1" };
    const secret = process.env.NOTIFY_WEBHOOK_SECRET;
    if (secret) headers["x-ccc-signature"] = signPayload(body, secret);

    const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.error(`[notify] ${event} webhook responded ${res.status}`);
      return { delivered: false, mode: "webhook", status: res.status };
    }
    return { delivered: true, mode: "webhook", status: res.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[notify] ${event} failed: ${msg}`);
    return { delivered: false, mode: "webhook", error: msg };
  }
}

/** Fire several events without throwing; resolves when all have settled. */
export async function notifyAll(items: Array<[NotifyEvent, Record<string, unknown>]>): Promise<NotifyResult[]> {
  return Promise.all(items.map(([e, p]) => notify(e, p)));
}
