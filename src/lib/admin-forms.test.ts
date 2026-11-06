import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDrinkForm, parseGatheringForm, parsePhotos, parseQuotes } from "./admin-forms.ts";

const base = {
  id: "",
  title: "Gathering No. 02",
  number: "2",
  slug: "gathering-02",
  description: "",
  neighborhood: "",
  neighborhoodLat: "",
  neighborhoodLng: "",
  startsAt: "2027-01-09T18:00",
  endsAt: "2027-01-09T22:00",
  capacity: "60",
  status: "upcoming",
  address: "",
  venueLat: "",
  venueLng: "",
  addressReleaseAt: "",
  drinkSlug: "",
  recapSummary: "",
  recapQuotes: "",
  recapPlaylistUrl: "",
  recapPhotos: "",
};

test("gathering form: blanks become null/TBA, no recap", () => {
  const r = parseGatheringForm(base, null);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.value.neighborhood, null);
  assert.equal(r.value.neighborhoodCenter, null);
  assert.equal(r.value.addressReleased, false);
  assert.equal(r.value.recap, null);
  assert.equal(r.value.capacity, 60);
});

test("gathering form: errors", () => {
  const r = parseGatheringForm(
    { ...base, endsAt: "2027-01-09T17:00", venueLat: "34.1", addressReleased: "on" },
    null,
  );
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.fieldErrors.endsAt);
  assert.ok(r.fieldErrors.venueLat);
  assert.ok(r.fieldErrors.address);
  const bad = parseGatheringForm({ ...base, slug: "Bad Slug", startsAt: "soon" }, null);
  assert.equal(bad.ok, false);
});

test("gathering form: recap parsing", () => {
  const r = parseGatheringForm(
    {
      ...base,
      recapSummary: "A night.",
      recapQuotes: "Best night in months — Maya\n“Came alone, left with friends” – J.",
      recapPhotos: "/assets/a.jpg | Guests at the long table",
      startsAt: "2027-01-09T18:00:00",
    },
    null,
  );
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(r.value.recap?.quotes, [
    { text: "Best night in months", name: "Maya" },
    { text: "Came alone, left with friends", name: "J." },
  ]);
  assert.equal(r.value.recap?.photos[0]?.alt, "Guests at the long table");
  assert.equal(r.value.startsAt, "2027-01-09T18:00");
  assert.deepEqual(parsePhotos("x.jpg"), [{ src: "x.jpg", alt: "" }]);
  assert.deepEqual(parseQuotes("Just text"), [{ text: "Just text", name: "" }]);
});

test("drink form keeps slug + founding from existing, notes split", () => {
  const existing = { slug: "green-goddess", founding: true } as never;
  const r = parseDrinkForm(
    { slug: "hacked", name: "Green Goddess", accent: "#8db35a", order: "1", notes: "Matcha\n\nHoney ", active: "on", addOnNote: "", legalReviewed: "on" },
    existing,
  );
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.value.slug, "green-goddess");
  assert.equal(r.value.founding, true);
  assert.deepEqual(r.value.notes, ["Matcha", "Honey"]);
  assert.equal(r.value.addOnNote, null);
  assert.equal(r.value.legalReviewed, false);
  assert.equal(parseDrinkForm({ slug: "x", name: "X", accent: "green", order: "1" }, null).ok, false);
});
