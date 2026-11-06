import { after } from "next/server";
import { getDataAdapter } from "@/lib/data";
import { fieldErrors, memberSignupSchema } from "@/lib/validation";
import { getClientIp, screenSubmission } from "@/lib/spam";
import { notify } from "@/lib/notify";
import { json, readBody, serverError } from "@/lib/http";
import { SITE_URL } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    if (!body) return json({ ok: false, message: "We couldn't read that submission.", fieldErrors: {} }, 400);

    const ip = getClientIp(req.headers);
    const screen = await screenSubmission({ route: "join", ip, body });
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
      // Look successful to bots; persist nothing.
      return json({ ok: true, status: "created", foundingNumber: (await adapter.countMembers()) + 1 }, 201);
    }

    const parsed = memberSignupSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) }, 400);
    }
    const { name, email, mobile, zip, instagram, source } = parsed.data;
    const result = await adapter.createMember({ name, email, mobile, zip, instagram, source, consent: true });

    if (result.status === "exists") {
      return json(
        { ok: true, status: "exists", message: "You're already on the list.", foundingNumber: result.member.foundingNumber },
        200,
      );
    }

    const m = result.member;
    after(() =>
      notify("member.welcome", {
        to: { name: m.name, email: m.email },
        member: { id: m.id, foundingNumber: m.foundingNumber, mobile: m.mobile ?? null, zip: m.zip ?? null, instagram: m.instagram ?? null, createdAt: m.createdAt },
        siteUrl: SITE_URL,
      }),
    );
    return json({ ok: true, status: "created", foundingNumber: m.foundingNumber }, 201);
  } catch (e) {
    return serverError("join", e);
  }
}
