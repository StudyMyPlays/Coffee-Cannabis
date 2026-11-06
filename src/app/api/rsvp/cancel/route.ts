import { after } from "next/server";
import { getDataAdapter } from "@/lib/data";
import { toPublicGathering } from "@/lib/data/public";
import { cancelTokenSchema } from "@/lib/validation";
import { getClientIp, rateLimitRoute } from "@/lib/spam";
import { notify } from "@/lib/notify";
import { rsvpPayload } from "@/lib/notify-payloads";
import { json, readBody, serverError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rl = rateLimitRoute("rsvpCancel", getClientIp(req.headers));
    if (!rl.ok) {
      return json({ ok: false, message: "Too many attempts. Please wait a few minutes." }, 429, {
        "retry-after": String(rl.retryAfterSec),
      });
    }
    const parsed = cancelTokenSchema.safeParse(await readBody(req));
    if (!parsed.success) return json({ ok: false, message: "That cancellation link isn't valid." }, 404);

    const adapter = getDataAdapter();
    const token = parsed.data.token;
    const before = await adapter.getRsvpByToken(token);
    if (!before) return json({ ok: false, message: "That cancellation link isn't valid." }, 404);

    const g = await adapter.getGathering(before.gatheringId);
    if (before.status === "cancelled") {
      return json({
        ok: true,
        status: "cancelled",
        alreadyCancelled: true,
        gathering: g ? toPublicGathering(g, await adapter.countRsvps(g.id)) : null,
      });
    }

    const result = await adapter.cancelRsvp(token);
    if (!result) return json({ ok: false, message: "That cancellation link isn't valid." }, 404);

    if (g) {
      const { rsvp, promoted } = result;
      after(async () => {
        await notify("rsvp.cancelled", rsvpPayload(rsvp, g));
        if (promoted) await notify("rsvp.promoted", rsvpPayload(promoted, g));
      });
    }
    return json({
      ok: true,
      status: "cancelled",
      alreadyCancelled: false,
      gathering: g ? toPublicGathering(g, await adapter.countRsvps(g.id)) : null,
    });
  } catch (e) {
    return serverError("rsvp/cancel", e);
  }
}
