import { test } from "node:test";
import assert from "node:assert/strict";
import {
  laWallTimeToUtc,
  utcToLaWallTime,
  utcToLaParts,
  formatLaDate,
  formatLaTimeRange,
  getCountdown,
  isValidLaWallTime,
} from "./time.ts";

const iso = (wall: string) => laWallTimeToUtc(wall).toISOString();

test("standard and daylight time conversions", () => {
  assert.equal(iso("2026-01-15T12:00"), "2026-01-15T20:00:00.000Z"); // PST -8
  assert.equal(iso("2026-07-04T12:00"), "2026-07-04T19:00:00.000Z"); // PDT -7
  assert.equal(iso("2026-12-05T18:00"), "2026-12-06T02:00:00.000Z");
});

test("spring forward 2026-03-08", () => {
  assert.equal(iso("2026-03-08T01:59"), "2026-03-08T09:59:00.000Z"); // still PST
  assert.equal(iso("2026-03-08T03:00"), "2026-03-08T10:00:00.000Z"); // PDT
  // 02:30 does not exist → moved forward to 03:30 PDT
  assert.equal(iso("2026-03-08T02:30"), "2026-03-08T10:30:00.000Z");
  assert.equal(utcToLaWallTime(laWallTimeToUtc("2026-03-08T02:30")), "2026-03-08T03:30");
  assert.equal(iso("2026-03-08T02:00"), "2026-03-08T10:00:00.000Z");
});

test("fall back 2026-11-01 picks first (PDT) occurrence", () => {
  assert.equal(iso("2026-11-01T00:30"), "2026-11-01T07:30:00.000Z");
  assert.equal(iso("2026-11-01T01:30"), "2026-11-01T08:30:00.000Z"); // first 01:30 (PDT)
  assert.equal(iso("2026-11-01T02:00"), "2026-11-01T10:00:00.000Z"); // PST
  // Both UTC instants of the repeated hour read back as 01:30 LA
  assert.equal(utcToLaWallTime("2026-11-01T08:30:00Z"), "2026-11-01T01:30");
  assert.equal(utcToLaWallTime("2026-11-01T09:30:00Z"), "2026-11-01T01:30");
});

test("round trip every 30 minutes across both 2026 transitions", () => {
  for (const day of ["2026-03-07", "2026-03-08", "2026-03-09", "2026-10-31", "2026-11-01", "2026-11-02"]) {
    for (let h = 0; h < 24; h++) {
      for (const m of ["00", "30"]) {
        const wall = `${day}T${String(h).padStart(2, "0")}:${m}`;
        if (day === "2026-03-08" && h === 2) continue; // non-existent hour
        assert.equal(utcToLaWallTime(laWallTimeToUtc(wall)), wall, wall);
      }
    }
  }
});

test("utcToLaParts", () => {
  const p = utcToLaParts(new Date("2026-12-06T02:00:00Z"));
  assert.deepEqual(p, { year: 2026, month: 12, day: 5, hour: 18, minute: 0, second: 0, weekday: 6 });
  assert.equal(utcToLaParts("2026-01-01T08:00:00Z").hour, 0);
});

test("formatLaDate", () => {
  const d = laWallTimeToUtc("2026-12-05T19:00");
  assert.equal(formatLaDate(d), "Saturday, December 5");
  assert.equal(formatLaDate(d, { format: "time" }), "7:00 PM PT");
  assert.equal(formatLaDate(d, { format: "dateTime" }), "Saturday, December 5 · 7:00 PM PT");
  assert.equal(formatLaDate(d, { format: "short" }), "Dec 5, 2026");
  assert.equal(formatLaDate(laWallTimeToUtc("2026-12-05T00:05"), { format: "time" }), "12:05 AM PT");
  assert.equal(formatLaDate(laWallTimeToUtc("2026-12-05T12:00"), { format: "time", zoneLabel: false }), "12:00 PM");
  assert.equal(formatLaTimeRange(laWallTimeToUtc("2026-12-05T18:00"), laWallTimeToUtc("2026-12-05T22:00")), "6:00 – 10:00 PM PT");
});

test("countdown across fall-back is 25 real hours", () => {
  const a = laWallTimeToUtc("2026-11-01T00:00").getTime();
  const b = laWallTimeToUtc("2026-11-02T00:00").getTime();
  const c = getCountdown(b, a);
  assert.equal(c.totalMs, 25 * 3_600_000);
  assert.deepEqual({ d: c.days, h: c.hours, m: c.minutes, s: c.seconds }, { d: 1, h: 1, m: 0, s: 0 });
  assert.equal(c.isPast, false);
});

test("countdown across spring-forward is 23 real hours", () => {
  const a = laWallTimeToUtc("2026-03-08T00:00").getTime();
  const b = laWallTimeToUtc("2026-03-09T00:00").getTime();
  assert.equal(getCountdown(b, a).totalMs, 23 * 3_600_000);
});

test("countdown at and after zero", () => {
  const zero = { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
  assert.deepEqual(getCountdown(1000, 1000), zero);
  assert.deepEqual(getCountdown(1000, 99_999), zero);
  const c = getCountdown(90_061_000, 0);
  assert.deepEqual([c.days, c.hours, c.minutes, c.seconds], [1, 1, 1, 1]);
});

test("invalid input throws", () => {
  for (const bad of ["", "2026-12-05", "2026-12-05 18:00", "2026-13-01T00:00", "2026-02-30T10:00", "2026-12-05T24:00", "2026-12-05T18:60", "nope"]) {
    assert.throws(() => laWallTimeToUtc(bad), RangeError, bad);
    assert.equal(isValidLaWallTime(bad), false);
  }
  assert.throws(() => laWallTimeToUtc(undefined as unknown as string), RangeError);
  assert.throws(() => utcToLaParts("not a date"), RangeError);
  assert.throws(() => getCountdown(Number.NaN, 0), RangeError);
});
