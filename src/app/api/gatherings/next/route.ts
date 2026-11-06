import { connection } from "next/server";
import { getDataAdapter } from "@/lib/data";
import { getNextGathering } from "@/lib/data/public";
import { json, serverError } from "@/lib/http";

export const runtime = "nodejs";

/** PublicGathering | null. Never cached: spots-left and address release change. */
export async function GET() {
  await connection();
  try {
    return json(await getNextGathering(getDataAdapter(), Date.now()));
  } catch (e) {
    return serverError("gatherings/next", e);
  }
}
