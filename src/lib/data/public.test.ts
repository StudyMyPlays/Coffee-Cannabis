import { test } from "node:test";
import assert from "node:assert/strict";
import { getNextGathering, getPastGatherings, getPublicDrinks, getSecretDrinks, toPublicGathering } from "./public.ts";
import type { DataAdapter, Drink, Gathering } from "./types.ts";

const g = (over: Partial<Gathering> = {}): Gathering => ({
  id: "g1", slug: "g1", number: 1, title: "T", description: "", neighborhood: null, neighborhoodCenter: null,
  startsAt: "2026-12-05T18:00", endsAt: "2026-12-05T22:00", capacity: 60, status: "upcoming",
  address: "123 Secret St", venueLocation: { lat: 34.1, lng: -118.3 }, addressReleased: false,
  addressReleaseAt: "2026-12-04T12:00", drinkSlug: null, recap: null, isPlaceholder: false, updatedAt: "",
  ...over,
});

const counts = { confirmed: 10, waitlist: 0 };

test("address hidden until scheduled release (LA time)", () => {
  const before = Date.parse("2026-12-04T19:59:00Z"); // 11:59 PST
  const atRelease = Date.parse("2026-12-04T20:00:00Z"); // 12:00 PST
  const hidden = toPublicGathering(g(), counts, before);
  assert.equal(hidden.address, null);
  assert.equal(hidden.venueLocation, null);
  assert.equal(hidden.addressIsReleased, false);
  assert.ok(!("addressReleaseAt" in hidden));
  const shown = toPublicGathering(g(), counts, atRelease);
  assert.equal(shown.address, "123 Secret St");
  assert.equal(shown.addressIsReleased, true);
  assert.equal(shown.startsAtUtc, "2026-12-06T02:00:00.000Z");
  assert.equal(shown.spotsLeft, 50);
});

test("manual flag releases immediately; no schedule stays hidden", () => {
  const now = Date.parse("2026-11-06T00:00:00Z");
  assert.equal(toPublicGathering(g({ addressReleased: true }), counts, now).address, "123 Secret St");
  assert.equal(toPublicGathering(g({ addressReleaseAt: null }), counts, now).address, null);
});

function fakeAdapter(gatherings: Gathering[], drinks: Drink[] = []): DataAdapter {
  return {
    listGatherings: async () => gatherings,
    countRsvps: async () => ({ confirmed: 0, waitlist: 0 }),
    listDrinks: async () => drinks,
  } as unknown as DataAdapter;
}

test("next / past selection", async () => {
  const now = Date.parse("2026-12-05T23:00:00Z"); // 15:00 PT Dec 5
  const a = fakeAdapter([
    g({ id: "later", startsAt: "2027-01-10T18:00", endsAt: "2027-01-10T22:00" }),
    g({ id: "tonight" }),
    g({ id: "draft", status: "draft", startsAt: "2026-12-01T18:00", endsAt: "2026-12-01T22:00" }),
    g({ id: "old", status: "past", startsAt: "2026-06-01T18:00", endsAt: "2026-06-01T22:00" }),
    g({ id: "ended", startsAt: "2026-10-01T18:00", endsAt: "2026-10-01T22:00" }),
  ]);
  assert.equal((await getNextGathering(a, now))?.id, "tonight");
  assert.deepEqual((await getPastGatherings(a, now)).map((x) => x.id), ["ended", "old"]);
  assert.equal(await getNextGathering(fakeAdapter([]), now), null);
});

test("drinks: secret split, inactive hidden, add-on stripped until legal review", async () => {
  const d = (over: Partial<Drink>) => ({ slug: "x", order: 1, active: true, secret: false, addOnNote: "CBD", legalReviewed: false, ...over }) as Drink;
  const a = fakeAdapter([], [d({ slug: "b", order: 2 }), d({ slug: "a", order: 1, legalReviewed: true }), d({ slug: "s", secret: true }), d({ slug: "off", active: false })]);
  const pub = await getPublicDrinks(a);
  assert.deepEqual(pub.map((x) => x.slug), ["a", "b"]);
  assert.equal(pub[0]!.addOnNote, "CBD");
  assert.equal(pub[1]!.addOnNote, null);
  assert.deepEqual((await getSecretDrinks(a)).map((x) => x.slug), ["s"]);
});

test("malformed hand-edited times are skipped, not fatal", async () => {
  const errors: unknown[] = [];
  const orig = console.error;
  console.error = (...a: unknown[]) => void errors.push(a);
  try {
    const a = fakeAdapter([g({ id: "bad", startsAt: "Dec 5 6pm" }), g({ id: "ok" })]);
    assert.equal((await getNextGathering(a, Date.parse("2026-11-06T00:00:00Z")))?.id, "ok");
    assert.equal(errors.length, 1);
  } finally {
    console.error = orig;
  }
});
