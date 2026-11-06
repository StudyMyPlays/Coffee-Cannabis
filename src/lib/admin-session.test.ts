import { test } from "node:test";
import assert from "node:assert/strict";
import { checkAdminPassword, createSessionToken, verifySessionToken } from "./admin-session.ts";

test("session tokens: sign, verify, tamper, expire, rotate", () => {
  const prev = { ...process.env };
  try {
    delete process.env.ADMIN_PASSWORD;
    assert.equal(verifySessionToken("a.b.c"), false);
    assert.throws(() => createSessionToken());
    assert.equal(checkAdminPassword(""), false);

    process.env.ADMIN_PASSWORD = "correct horse";
    const t = createSessionToken();
    assert.equal(verifySessionToken(t), true);
    assert.equal(verifySessionToken(t.slice(0, -2) + (t.endsWith("AA") ? "BB" : "AA")), false);
    assert.equal(verifySessionToken(t, Date.now() + 13 * 3600_000), false); // 12h expiry
    assert.equal(verifySessionToken(undefined), false);
    assert.equal(checkAdminPassword("correct horse"), true);
    assert.equal(checkAdminPassword("correct hors"), false);

    process.env.ADMIN_SESSION_SECRET = "s3cret";
    assert.equal(verifySessionToken(t), false); // secret changed
    const t2 = createSessionToken();
    process.env.ADMIN_PASSWORD = "new password";
    assert.equal(verifySessionToken(t2), false); // password rotation signs out
  } finally {
    process.env = prev;
  }
});
