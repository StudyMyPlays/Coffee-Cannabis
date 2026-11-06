/**
 * Data adapter selection (server-only — the local adapter uses node:fs).
 * UI and route handlers call getDataAdapter() and never import an adapter
 * directly, so a database can be swapped in without touching them.
 */
import type { DataAdapter } from "./types.ts";
import { LocalAdapter } from "./local-adapter.ts";

export type { DataAdapter } from "./types.ts";

const g = globalThis as unknown as { __cccAdapter?: DataAdapter };

function createAdapter(kind: string): DataAdapter {
  switch (kind) {
    case "local":
      return new LocalAdapter();

    // To add a database later:
    // 1. Create src/lib/data/supabase-adapter.ts implementing DataAdapter
    //    (tables: gatherings, drinks, members, rsvps, notification_markers;
    //    make createRsvp a single SQL function/transaction so capacity is
    //    enforced atomically; unique index on (gathering_id, lower(email))
    //    where status <> 'cancelled'; unique index on lower(members.email)).
    // 2. Uncomment:
    // case "supabase":
    //   return new SupabaseAdapter({
    //     url: process.env.SUPABASE_URL!,
    //     serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    //   });
    // 3. Set DATA_ADAPTER=supabase in the Vercel project.

    default:
      throw new Error(`Unknown DATA_ADAPTER "${kind}". Supported: "local".`);
  }
}

/** Process-wide singleton chosen by DATA_ADAPTER (default "local"). */
export function getDataAdapter(): DataAdapter {
  g.__cccAdapter ??= createAdapter((process.env.DATA_ADAPTER || "local").trim().toLowerCase());
  return g.__cccAdapter;
}
