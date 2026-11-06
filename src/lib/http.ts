/** Small helpers for JSON route handlers. */

const NO_STORE = { "cache-control": "no-store" };

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

export function serverError(where: string, e: unknown): Response {
  console.error(`[api] ${where} failed:`, e);
  return json({ ok: false, message: "Something went wrong on our side. Please try again in a moment." }, 500);
}

const MAX_BODY_BYTES = 16 * 1024;

/**
 * Read a JSON or form-encoded body into a plain object. Returns null for an
 * unreadable/oversized/non-object body.
 */
export async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > MAX_BODY_BYTES) return null;
    const type = req.headers.get("content-type") ?? "";
    if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
      const fd = await req.formData();
      const out: Record<string, unknown> = {};
      for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
      return out;
    }
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return null;
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
