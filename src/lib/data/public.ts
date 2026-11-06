/**
 * Public projections. The browser only ever receives these shapes: private
 * fields (address, venue pin) are stripped until released, and add-on
 * language is stripped until legal review is complete.
 *
 * No node imports — takes the adapter as a parameter.
 */
import type { DataAdapter, Drink, Gathering, PublicGathering, RsvpCounts } from "./types.ts";
import { isValidLaWallTime, laWallTimeToUtc } from "../time.ts";

type Now = Date | number;
const ms = (now: Now) => (typeof now === "number" ? now : now.getTime());

/** Released manually, or the scheduled release moment has passed. */
export function isAddressReleased(g: Gathering, now: Now = Date.now()): boolean {
  if (g.addressReleased) return true;
  if (!g.addressReleaseAt) return false;
  try {
    return ms(now) >= laWallTimeToUtc(g.addressReleaseAt).getTime();
  } catch {
    return false;
  }
}

export function hasEnded(g: Gathering, now: Now = Date.now()): boolean {
  return laWallTimeToUtc(g.endsAt).getTime() <= ms(now);
}

export function toPublicGathering(g: Gathering, counts: RsvpCounts, now: Now = Date.now()): PublicGathering {
  const released = isAddressReleased(g, now);
  return {
    id: g.id,
    slug: g.slug,
    number: g.number,
    title: g.title,
    description: g.description,
    neighborhood: g.neighborhood,
    neighborhoodCenter: g.neighborhoodCenter,
    startsAt: g.startsAt,
    endsAt: g.endsAt,
    capacity: g.capacity,
    status: g.status,
    addressReleased: g.addressReleased,
    drinkSlug: g.drinkSlug,
    recap: g.recap,
    isPlaceholder: g.isPlaceholder,
    updatedAt: g.updatedAt,
    address: released ? g.address : null,
    venueLocation: released ? g.venueLocation : null,
    addressIsReleased: released && Boolean(g.address),
    startsAtUtc: laWallTimeToUtc(g.startsAt).toISOString(),
    endsAtUtc: laWallTimeToUtc(g.endsAt).toISOString(),
    addressReleaseAtUtc: g.addressReleaseAt ? laWallTimeToUtc(g.addressReleaseAt).toISOString() : null,
    attendeeCount: counts.confirmed,
    waitlistCount: counts.waitlist,
    spotsLeft: Math.max(0, g.capacity - counts.confirmed),
  };
}

const startMs = (g: Gathering) => laWallTimeToUtc(g.startsAt).getTime();

/**
 * Content can be hand-edited (e.g. in the GitHub web editor). Skip entries
 * with unparseable times instead of crashing the page, and log them.
 */
function isUsable(g: Gathering): boolean {
  const ok =
    isValidLaWallTime(g.startsAt) &&
    isValidLaWallTime(g.endsAt) &&
    (g.addressReleaseAt == null || isValidLaWallTime(g.addressReleaseAt));
  if (!ok) console.error(`[data] Skipping gathering "${g.slug ?? g.id}": invalid startsAt/endsAt/addressReleaseAt (expected "YYYY-MM-DDTHH:mm").`);
  return ok;
}

async function usableGatherings(adapter: DataAdapter): Promise<Gathering[]> {
  return (await adapter.listGatherings()).filter(isUsable);
}

/** Soonest "upcoming" gathering that hasn't ended yet, or null. */
export async function getNextGathering(adapter: DataAdapter, now: Now = Date.now()): Promise<PublicGathering | null> {
  const list = (await usableGatherings(adapter))
    .filter((g) => g.status === "upcoming" && !hasEnded(g, now))
    .sort((a, b) => startMs(a) - startMs(b));
  const next = list[0];
  if (!next) return null;
  return toPublicGathering(next, await adapter.countRsvps(next.id), now);
}

/** Status "past", or "upcoming" whose end time has passed. Newest first. */
export async function getPastGatherings(adapter: DataAdapter, now: Now = Date.now()): Promise<PublicGathering[]> {
  const list = (await usableGatherings(adapter))
    .filter((g) => g.status === "past" || (g.status === "upcoming" && hasEnded(g, now)))
    .sort((a, b) => startMs(b) - startMs(a));
  return Promise.all(list.map(async (g) => toPublicGathering(g, await adapter.countRsvps(g.id), now)));
}

/** A single non-draft gathering by id or slug (drafts are never public). */
export async function getPublicGathering(
  adapter: DataAdapter,
  idOrSlug: string,
  now: Now = Date.now(),
): Promise<PublicGathering | null> {
  const g = await adapter.getGathering(idOrSlug);
  if (!g || g.status === "draft" || !isUsable(g)) return null;
  return toPublicGathering(g, await adapter.countRsvps(g.id), now);
}

/** Strips add-on language unless legal review is complete. */
export function toPublicDrink(d: Drink): Drink {
  return { ...d, addOnNote: d.legalReviewed ? d.addOnNote : null };
}

/** Active, non-secret drinks in display order. */
export async function getPublicDrinks(adapter: DataAdapter): Promise<Drink[]> {
  return (await adapter.listDrinks())
    .filter((d) => d.active && !d.secret)
    .sort((a, b) => a.order - b.order)
    .map(toPublicDrink);
}

/** Active secret drinks (e.g. Green Mile), revealed by interaction. */
export async function getSecretDrinks(adapter: DataAdapter): Promise<Drink[]> {
  return (await adapter.listDrinks())
    .filter((d) => d.active && d.secret)
    .sort((a, b) => a.order - b.order)
    .map(toPublicDrink);
}

/** One active drink by slug (secret included), sanitised. */
export async function getPublicDrink(adapter: DataAdapter, slug: string): Promise<Drink | null> {
  const d = await adapter.getDrink(slug);
  return d && d.active ? toPublicDrink(d) : null;
}
