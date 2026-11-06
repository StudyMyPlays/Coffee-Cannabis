import type { NextRequest } from "next/server";
import { getDataAdapter } from "@/lib/data";
import { toPublicGathering } from "@/lib/data/public";
import { cancelTokenSchema } from "@/lib/validation";
import { getClientIp, rateLimitRoute } from "@/lib/spam";
import { json, serverError } from "@/lib/http";

export const runtime = "nodejs";

/** For the cancel page: who/what this token refers to. Never returns the email. */
export async function GET(req: NextRequest) {
  try {
    const rl = rateLimitRoute("rsvpCancel", getClientIp(req.headers));
    if (!rl.ok) {
      return json({ ok: false, message: "Too many attempts. Please wait a few minutes." }, 429, {
        "retry-after": String(rl.retryAfterSec),
      });
    }
    const parsed = cancelTokenSchema.safeParse({ token: req.nextUrl.searchParams.get("token") ?? "" });
    if (!parsed.success) return json({ ok: false, message: "That link isn't valid." }, 404);

    const adapter = getDataAdapter();
    const rsvp = await adapter.getRsvpByToken(parsed.data.token);
    if (!rsvp) return json({ ok: false, message: "That link isn't valid." }, 404);

    const g = await adapter.getGathering(rsvp.gatheringId);
    let position: number | null = null;
    if (rsvp.status === "waitlist") {
      const waitlist = (await adapter.listRsvps(rsvp.gatheringId)).filter((r) => r.status === "waitlist");
      position = waitlist.findIndex((r) => r.id === rsvp.id) + 1 || null;
    }
    return json({
      ok: true,
      rsvp: { name: rsvp.name, status: rsvp.status, position, createdAt: rsvp.createdAt },
      gathering: g ? toPublicGathering(g, await adapter.countRsvps(g.id)) : null,
    });
  } catch (e) {
    return serverError("rsvp/status", e);
  }
}
