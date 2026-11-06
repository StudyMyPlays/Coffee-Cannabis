import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { LocalAdapter } from "./local-adapter.ts";
import { FoundingDrinkError, ContentReadOnlyError } from "./errors.ts";
import type { Drink, Gathering } from "./types.ts";

let root: string;

const gathering = (over: Partial<Gathering> = {}): Gathering => ({
  id: "g1",
  slug: "gathering-01",
  number: 1,
  title: "Gathering No. 01",
  description: "",
  neighborhood: null,
  neighborhoodCenter: null,
  startsAt: "2099-12-05T18:00",
  endsAt: "2099-12-05T22:00",
  capacity: 2,
  status: "upcoming",
  address: null,
  venueLocation: null,
  addressReleased: false,
  addressReleaseAt: null,
  drinkSlug: null,
  recap: null,
  isPlaceholder: false,
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const drink = (over: Partial<Drink>): Drink => ({
  slug: "x",
  name: "X",
  trademark: false,
  role: "",
  profile: "",
  tagline: "",
  sensory: "",
  notes: [],
  image: null,
  imageAlt: "",
  accent: "#000000",
  order: 1,
  founding: false,
  secret: false,
  seasonal: false,
  active: true,
  addOnNote: null,
  legalReviewed: false,
  ...over,
});

function makeAdapter(gatherings: Gathering[], drinks: Drink[] = [], contentWritable?: boolean) {
  const dir = mkdtempSync(path.join(root, "case-"));
  const contentDir = path.join(dir, "content");
  mkdirSync(contentDir);
  writeFileSync(path.join(contentDir, "gatherings.json"), JSON.stringify(gatherings));
  writeFileSync(path.join(contentDir, "drinks.json"), JSON.stringify(drinks));
  return { adapter: new LocalAdapter({ contentDir, runtimeDir: path.join(dir, ".data"), contentWritable, quiet: true }), dir };
}

before(() => {
  root = mkdtempSync(path.join(os.tmpdir(), "ccc-adapter-test-"));
});
after(() => rmSync(root, { recursive: true, force: true }));

test("capacity → waitlist → cancel promotes earliest waitlisted", async () => {
  const { adapter } = makeAdapter([gathering()]);
  const a = await adapter.createRsvp("g1", { name: "A", email: "a@x.co" });
  const b = await adapter.createRsvp("gathering-01", { name: "B", email: "b@x.co" }); // by slug
  const c = await adapter.createRsvp("g1", { name: "C", email: "c@x.co" });
  const d = await adapter.createRsvp("g1", { name: "D", email: "d@x.co" });
  assert.equal(a.status, "confirmed");
  assert.equal(b.status, "confirmed");
  assert.equal(c.status, "waitlist");
  assert.equal(d.status, "waitlist");
  if (c.status === "waitlist") assert.equal(c.position, 1);
  if (d.status === "waitlist") assert.equal(d.position, 2);
  assert.deepEqual(await adapter.countRsvps("g1"), { confirmed: 2, waitlist: 2 });

  if (a.status !== "confirmed") throw new Error("unreachable");
  const res = await adapter.cancelRsvp(a.rsvp.cancelToken);
  assert.equal(res?.rsvp.status, "cancelled");
  assert.equal(res?.promoted?.name, "C");
  assert.deepEqual(await adapter.countRsvps("g1"), { confirmed: 2, waitlist: 1 });

  // Cancelling again is idempotent and promotes nobody.
  const again = await adapter.cancelRsvp(a.rsvp.cancelToken);
  assert.equal(again?.promoted, null);
  assert.deepEqual(await adapter.countRsvps("g1"), { confirmed: 2, waitlist: 1 });

  // Cancelling a waitlisted guest promotes nobody.
  if (d.status !== "waitlist") throw new Error("unreachable");
  assert.equal((await adapter.cancelRsvp(d.rsvp.cancelToken))?.promoted, null);
  assert.equal(await adapter.cancelRsvp("nope"), null);
});

test("concurrent RSVPs never oversell", async () => {
  const { adapter } = makeAdapter([gathering({ capacity: 5 })]);
  const results = await Promise.all(
    Array.from({ length: 20 }, (_, i) => adapter.createRsvp("g1", { name: `P${i}`, email: `p${i}@x.co` })),
  );
  assert.equal(results.filter((r) => r.status === "confirmed").length, 5);
  assert.equal(results.filter((r) => r.status === "waitlist").length, 15);
  assert.deepEqual(await adapter.countRsvps("g1"), { confirmed: 5, waitlist: 15 });
});

test("RSVP dedupe by lowercased email; re-RSVP allowed after cancel", async () => {
  const { adapter } = makeAdapter([gathering()]);
  const first = await adapter.createRsvp("g1", { name: "A", email: "Ann@X.co" });
  const dup = await adapter.createRsvp("g1", { name: "A again", email: " ann@x.CO " });
  assert.equal(dup.status, "duplicate");
  if (first.status !== "confirmed" || dup.status !== "duplicate") throw new Error("unreachable");
  assert.equal(dup.rsvp.id, first.rsvp.id);
  assert.equal(first.rsvp.cancelToken.length, 43); // 32 bytes base64url
  await adapter.cancelRsvp(first.rsvp.cancelToken);
  assert.equal((await adapter.createRsvp("g1", { name: "A", email: "ann@x.co" })).status, "confirmed");
});

test("RSVP refused for draft / cancelled / past / unknown", async () => {
  const { adapter } = makeAdapter([
    gathering({ id: "d", slug: "d", status: "draft" }),
    gathering({ id: "c", slug: "c", status: "cancelled" }),
    gathering({ id: "p", slug: "p", status: "past" }),
    gathering({ id: "e", slug: "e", startsAt: "2020-01-01T18:00", endsAt: "2020-01-01T22:00" }),
  ]);
  const reason = async (id: string) => {
    const r = await adapter.createRsvp(id, { name: "A", email: "a@x.co" });
    return r.status === "closed" ? r.reason : r.status;
  };
  assert.equal(await reason("d"), "draft");
  assert.equal(await reason("c"), "cancelled");
  assert.equal(await reason("p"), "past");
  assert.equal(await reason("e"), "past");
  assert.equal(await reason("zzz"), "not_found");
});

test("members dedupe by email with sequential founding numbers", async () => {
  const { adapter } = makeAdapter([]);
  const a = await adapter.createMember({ name: "A", email: "A@x.co", consent: true });
  const b = await adapter.createMember({ name: "B", email: "b@x.co", consent: true });
  const a2 = await adapter.createMember({ name: "A2", email: "a@X.CO", consent: true });
  assert.equal(a.status, "created");
  assert.equal(a.member.foundingNumber, 1);
  assert.equal(b.member.foundingNumber, 2);
  assert.equal(a2.status, "exists");
  assert.equal(a2.member.id, a.member.id);
  assert.equal(await adapter.countMembers(), 2);
  assert.deepEqual((await adapter.listMembers()).map((m) => m.foundingNumber), [1, 2]);
});

test("founding drinks cannot be deleted; seasonal can", async () => {
  const { adapter, dir } = makeAdapter([], [
    drink({ slug: "green-goddess", founding: true }),
    drink({ slug: "winter-spice", seasonal: true, order: 2 }),
  ]);
  await assert.rejects(adapter.deleteDrink("green-goddess"), FoundingDrinkError);
  await adapter.deleteDrink("winter-spice");
  assert.deepEqual((await adapter.listDrinks()).map((d) => d.slug), ["green-goddess"]);
  // upsert can't strip founding status or grant it
  await adapter.upsertDrink(drink({ slug: "green-goddess", founding: false, name: "Renamed" }));
  const saved = JSON.parse(readFileSync(path.join(dir, "content", "drinks.json"), "utf8")) as Drink[];
  assert.equal(saved[0]!.founding, true);
  assert.equal(saved[0]!.name, "Renamed");
  assert.equal((await adapter.upsertDrink(drink({ slug: "new", founding: true }))).founding, false);
});

test("read-only content refuses writes but runtime data still works", async () => {
  const { adapter } = makeAdapter([gathering()], [drink({ slug: "s" })], false);
  assert.equal(adapter.contentWritable, false);
  assert.equal(adapter.runtimeIsEphemeral, true);
  await assert.rejects(adapter.upsertGathering(gathering({ title: "x" })), ContentReadOnlyError);
  await assert.rejects(adapter.upsertDrink(drink({ slug: "s" })), ContentReadOnlyError);
});

test("upsertGathering assigns id + updatedAt; claimNotification is once-only", async () => {
  const { adapter } = makeAdapter([]);
  const saved = await adapter.upsertGathering(gathering({ id: "", slug: "n" }));
  assert.match(saved.id, /^[0-9a-f-]{36}$/);
  assert.notEqual(saved.updatedAt, "2026-01-01T00:00:00.000Z");
  assert.equal((await adapter.getGathering("n"))?.id, saved.id);
  assert.equal(await adapter.claimNotification("k"), true);
  assert.equal(await adapter.claimNotification("k"), false);
});
