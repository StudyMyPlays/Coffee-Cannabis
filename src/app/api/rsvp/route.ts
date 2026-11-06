import { after } from "next/server";
import { randomBytes } from "node:crypto";
import { getDataAdapter } from "@/lib/data";
import { getPublicGathering, toPublicGathering } from "@/lib/data/public";
import { fieldErrors, rsvpSchema } from "@/lib/validation";
import { getClientIp, screenSubmission } from "@/lib/spam";
import { notify } from "@/lib/notify";
import { rsvpPayload } from "@/lib/notify-payloads";
import { json, readBody, serverError } from "@/lib/http";

export const runtime = "nodejs";

const CLOSED_MESSAGES = {
  past: "This gathering has already happened.",
  cancelled: "This gathering has been cancelled.",
  draft: "RSVPs for this gathering aren't open yet.",
  not_found: "We couldn't find that gathering.",
} as const;

export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    if (!body) return json({ ok: false, message: "We couldn't read that submission.", fieldErrors: {} }, 400);

    const ip = getClientIp(req.headers);
    const screen = await screenSubmission({ route: "rsvp", ip, body });
    if (screen.action === "rate-limited") {
      return json(
        { ok: false, message: "Too many attempts. Please wait a few minutes and try again." },
        429,
        { "retry-after": String(screen.retryAfterSec) },
      );
    }
    if (screen.action === "challenge-failed") {
      return json({ ok: false, message: "Please complete the verification and try again.", fieldErrors: {} }, 400);
    }

    const adapter = getDataAdapter();
    if (screen.action === "fake-success") {
      const gid = typeof body.gatheringId === "string" ? body.gatheringId : "";
      const gathering = gid ? await getPublicGathering(adapter, gid) : null;
      return json({ ok: true, status: "confirmed", cancelToken: randomBytes(32).toString("base64url"), gathering }, 201);
    }

    const parsed = rsvpSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) }, 400);
    }
    const { gatheringId, name, email } = parsed.data;
    const result = await adapter.createRsvp(gatheringId, { name, email });

    if (result.status === "closed") {
      const status = result.reason === "not_found" ? 404 : 409;
      return json({ ok: false, status: "closed", reason: result.reason, message: CLOSED_MESSAGES[result.reason] }, status);
    }

    const g = await adapter.getGathering(result.rsvp.gatheringId);
    if (!g) return serverError("rsvp", new Error("gathering vanished after RSVP"));
    const gathering = toPublicGathering(g, result.counts);

    if (result.status === "duplicate") {
      // Never hand out the existing cancel token to whoever typed the email —
      // re-send it to the inbox instead.
      const r = result.rsvp;
      const event = r.status === "waitlist" ? "rsvp.waitlisted" : "rsvp.confirmed";
      after(() => notify(event, rsvpPayload(r, g, { resend: true })));
      return json(
        {
          ok: true,
          status: "duplicate",
          rsvpStatus: r.status,
          message: "You're already on the list — we've re-sent your confirmation.",
          gathering,
        },
        200,
      );
    }

    const r = result.rsvp;
    if (result.status === "confirmed") {
      after(() => notify("rsvp.confirmed", rsvpPayload(r, g)));
      return json({ ok: true, status: "confirmed", cancelToken: r.cancelToken, gathering }, 201);
    }
    const position = result.position;
    after(() => notify("rsvp.waitlisted", rsvpPayload(r, g, { position })));
    return json({ ok: true, status: "waitlist", position, cancelToken: r.cancelToken, gathering }, 201);
  } catch (e) {
    return serverError("rsvp", e);
  }
}
