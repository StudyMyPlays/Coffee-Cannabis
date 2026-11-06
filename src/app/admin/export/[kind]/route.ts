import type { NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDataAdapter } from "@/lib/data";

export const runtime = "nodejs";

/** CSV cell: quote, escape quotes, and neutralise spreadsheet formula injection. */
function cell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function csv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

function download(name: string, body: string): Response {
  return new Response("﻿" + body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

/** GET /admin/export/members  |  /admin/export/rsvps?gatheringId=… (omit for all). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  if (!(await isAdminAuthenticated())) return new Response("Unauthorized", { status: 401 });
  const { kind } = await ctx.params;
  const adapter = getDataAdapter();
  const stamp = new Date().toISOString().slice(0, 10);

  if (kind === "members") {
    const members = await adapter.listMembers();
    return download(
      `ccc-members-${stamp}.csv`,
      csv(
        ["foundingNumber", "name", "email", "mobile", "zip", "instagram", "source", "createdAt"],
        members.map((m) => [m.foundingNumber, m.name, m.email, m.mobile, m.zip, m.instagram, m.source, m.createdAt]),
      ),
    );
  }

  if (kind === "rsvps") {
    const only = req.nextUrl.searchParams.get("gatheringId");
    const gatherings = (await adapter.listGatherings()).filter((g) => !only || g.id === only);
    const rows: unknown[][] = [];
    for (const g of gatherings) {
      for (const r of await adapter.listRsvps(g.id)) {
        rows.push([g.number, g.title, r.name, r.email, r.status, r.createdAt, r.updatedAt]);
      }
    }
    const suffix = only && gatherings[0] ? gatherings[0].slug : "all";
    return download(
      `ccc-rsvps-${suffix}-${stamp}.csv`,
      csv(["gatheringNumber", "gathering", "name", "email", "status", "createdAt", "updatedAt"], rows),
    );
  }

  return new Response("Not found", { status: 404 });
}
