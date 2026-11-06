import { test } from "node:test";
import assert from "node:assert/strict";
import { fieldErrors, makeMemberSignupSchema, memberSignupSchema, normalizeMobile, rsvpSchema } from "./validation.ts";

const base = { name: "  Ana  ", email: " Ana@Example.COM ", consent: true, startedAt: 1700000000000 };

test("valid signup normalises fields", () => {
  const r = memberSignupSchema.parse({ ...base, mobile: "(310) 555-0134", instagram: "@ana.la", zip: "90026", company: "" });
  assert.equal(r.name, "Ana");
  assert.equal(r.email, "ana@example.com");
  assert.equal(r.mobile, "+13105550134");
  assert.equal(r.instagram, "ana.la");
  assert.equal(r.zip, "90026");
  assert.equal(r.company, undefined);
});

test("zip accepts neighborhood text, rejects bad digits", () => {
  assert.equal(memberSignupSchema.parse({ ...base, zip: "Silver Lake" }).zip, "Silver Lake");
  assert.equal(memberSignupSchema.safeParse({ ...base, zip: "9002" }).success, false);
});

test("consent must be true; 'on' accepted", () => {
  assert.equal(memberSignupSchema.safeParse({ ...base, consent: "on" }).success, true);
  const r = memberSignupSchema.safeParse({ ...base, consent: false });
  assert.equal(r.success, false);
  if (!r.success) assert.match(fieldErrors(r.error).consent!, /confirm/);
});

test("mobile optional by default, required when configured", () => {
  assert.equal(memberSignupSchema.safeParse({ ...base, mobile: "" }).success, true);
  const req = makeMemberSignupSchema({ mobileRequired: true });
  const r = req.safeParse({ ...base, mobile: "" });
  assert.equal(r.success, false);
  if (!r.success) assert.ok(fieldErrors(r.error).mobile);
  assert.equal(memberSignupSchema.safeParse({ ...base, mobile: "12345" }).success, false);
});

test("normalizeMobile", () => {
  assert.equal(normalizeMobile("310.555.0134"), "+13105550134");
  assert.equal(normalizeMobile("1 310 555 0134"), "+13105550134");
  assert.equal(normalizeMobile("+44 20 7946 0958"), "+442079460958");
  assert.equal(normalizeMobile("abc"), null);
});

test("errors map to fields", () => {
  const r = memberSignupSchema.safeParse({ name: "", email: "nope", instagram: "bad handle!", company: "Acme" });
  assert.equal(r.success, false);
  if (!r.success) {
    const fe = fieldErrors(r.error);
    for (const k of ["name", "email", "instagram", "consent", "company", "startedAt"]) assert.ok(fe[k], k);
  }
});

test("rsvp schema", () => {
  assert.equal(rsvpSchema.safeParse({ gatheringId: "g1", name: "B", email: "b@x.co", startedAt: "1700000000000" }).success, true);
  assert.equal(rsvpSchema.safeParse({ gatheringId: "", name: "B", email: "b@x.co", startedAt: 1 }).success, false);
});
