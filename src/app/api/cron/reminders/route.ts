import { timingSafeEqual, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getDataAdapter } from "@/lib/data";
import { hasEnded, isAddressReleased } from "@/lib/data/public";
import { notify } from "@/lib/notify";
import { broadcastRecipients, gatheringSummary, locationDropPayload } from "@/lib/notify-payloads";
import { laWallTimeToUtc } from "@/lib/time";
import { json, serverError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

const HOUR = 3_600_000;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = req.headers.get("authorization") ?? "";
  const a = createHash("sha256").update(got).digest();
  const b = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(a, b);
}

/**
 * Daily job (see vercel.json). Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
 * - gathering.reminder: gatherings starting 24–48h from now (a daily run hits
 *   each gathering exactly once), sent to confirmed guests.
 * - gathering.location_drop: scheduled release time has passed, address set,
 *   manual flag not used yet.
 * Idempotent via adapter.claimNotification markers. With the local adapter on
 * Vercel those markers live in ephemeral /tmp, so a cold start between two
 * runs could repeat a message — another reason to connect a database.
 */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) {
    return json({ ok: false, message: "CRON_SECRET is not configured." }, 503);
  }
  if (!authorized(req)) return json({ ok: false, message: "Unauthorized" }, 401);

  try {
    const adapter = getDataAdapter();
    const now = Date.now();
    const sent: Array<{ event: string; gathering: string; recipients: number }> = [];
    const skipped: Array<{ gathering: string; reason: string }> = [];
    let changed = false;

    for (const g of await adapter.listGatherings()) {
      if (g.status !== "upcoming" || hasEnded(g, now)) continue;
      const startsIn = laWallTimeToUtc(g.startsAt).getTime() - now;

      if (startsIn >= 24 * HOUR && startsIn < 48 * HOUR) {
        if (await adapter.claimNotification(`reminder:${g.id}:${g.startsAt}`)) {
          const recipients = broadcastRecipients(await adapter.listRsvps(g.id));
          await notify("gathering.reminder", {
            gathering: gatheringSummary(g),
            addressReleased: isAddressReleased(g, now),
            recipients,
          });
          sent.push({ event: "gathering.reminder", gathering: g.slug, recipients: recipients.length });
        }
      }

      const scheduledReleasePassed =
        !g.addressReleased && g.addressReleaseAt && now >= laWallTimeToUtc(g.addressReleaseAt).getTime();
      if (scheduledReleasePassed) {
        if (!g.address) {
          skipped.push({ gathering: g.slug, reason: "release time passed but no address is set" });
        } else if (await adapter.claimNotification(`location_drop:${g.id}`)) {
          const confirmed = (await adapter.listRsvps(g.id)).filter((r) => r.status === "confirmed");
          await notify("gathering.location_drop", locationDropPayload(g, confirmed));
          sent.push({ event: "gathering.location_drop", gathering: g.slug, recipients: confirmed.length });
          changed = true;
        }
      }
    }

    if (changed) revalidatePath("/", "layout");
    return json({ ok: true, ranAt: new Date(now).toISOString(), sent, skipped });
  } catch (e) {
    return serverError("cron/reminders", e);
  }
}
