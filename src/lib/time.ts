/**
 * Los Angeles time helpers. Every gathering time in content is an LA *wall
 * clock* string ("YYYY-MM-DDTHH:mm"); these helpers turn it into a real UTC
 * instant and back, DST-safe, using only Intl (no dependencies).
 *
 * Isomorphic: safe to import from client and server code.
 */

export const LA_TZ = "America/Los_Angeles";

const WALL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DAY_MS = 86_400_000;

export interface LaParts {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
  /** 0–23 */
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

let partsFormatter: Intl.DateTimeFormat | null = null;
function getPartsFormatter(): Intl.DateTimeFormat {
  partsFormatter ??= new Intl.DateTimeFormat("en-US", {
    timeZone: LA_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  });
  return partsFormatter;
}

const WEEKDAY_SHORT: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function toDate(input: Date | string | number): Date {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) throw new RangeError(`Invalid date: ${String(input)}`);
  return d;
}

/** Wall-clock components of a UTC instant, as seen in Los Angeles. */
export function utcToLaParts(date: Date | string | number): LaParts {
  const d = toDate(date);
  const out: Record<string, string> = {};
  for (const p of getPartsFormatter().formatToParts(d)) out[p.type] = p.value;
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    // Some ICU versions emit "24" for midnight even with h23; normalise.
    hour: Number(out.hour) % 24,
    minute: Number(out.minute),
    second: Number(out.second),
    weekday: WEEKDAY_SHORT[out.weekday] ?? new Date(Date.UTC(Number(out.year), Number(out.month) - 1, Number(out.day))).getUTCDay(),
  };
}

/** LA offset from UTC in ms at a given instant (e.g. -7h during PDT, -8h during PST). */
function laOffsetMs(utcMs: number): number {
  const p = utcToLaParts(utcMs);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  // Drop the sub-second part of the instant so the difference is exact.
  return asUtc - (Math.floor(utcMs / 1000) * 1000);
}

/** Parse and validate "YYYY-MM-DDTHH:mm". Throws RangeError on bad input. */
export function parseLaWallTime(wall: string): { year: number; month: number; day: number; hour: number; minute: number } {
  if (typeof wall !== "string") throw new RangeError("LA wall time must be a string");
  const m = WALL_RE.exec(wall.trim());
  if (!m) throw new RangeError(`Invalid LA wall time "${wall}" (expected YYYY-MM-DDTHH:mm)`);
  const [year, month, day, hour, minute] = m.slice(1).map(Number) as [number, number, number, number, number];
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth || hour > 23 || minute > 59) {
    throw new RangeError(`Invalid LA wall time "${wall}" (out of range)`);
  }
  return { year, month, day, hour, minute };
}

export function isValidLaWallTime(wall: unknown): wall is string {
  if (typeof wall !== "string") return false;
  try {
    parseLaWallTime(wall);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert an LA wall-clock time to the UTC instant it denotes.
 *
 * DST rules (documented behaviour):
 * - Spring-forward gap (e.g. 2026-03-08 02:30 does not exist): the time is
 *   moved FORWARD by the gap, so 02:30 → 03:30 PDT (10:30Z).
 * - Fall-back overlap (e.g. 2026-11-01 01:30 happens twice): the FIRST
 *   occurrence is chosen, i.e. 01:30 PDT (08:30Z), not 01:30 PST.
 *
 * Works by testing every offset LA uses around that date and keeping the
 * ones that round-trip; converges in at most three Intl lookups per candidate.
 */
export function laWallTimeToUtc(wall: string): Date {
  const { year, month, day, hour, minute } = parseLaWallTime(wall);
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute);

  const candidates = new Set<number>([
    laOffsetMs(wallAsUtc - DAY_MS),
    laOffsetMs(wallAsUtc),
    laOffsetMs(wallAsUtc + DAY_MS),
  ]);

  const valid: number[] = [];
  const all: number[] = [];
  for (const off of candidates) {
    const t = wallAsUtc - off;
    all.push(t);
    if (laOffsetMs(t) === off) valid.push(t);
  }

  if (valid.length > 0) return new Date(Math.min(...valid)); // overlap → earliest (PDT)
  // Gap: no offset round-trips. Using the pre-transition (standard) offset
  // gives the latest candidate, which is the wall time shifted forward.
  return new Date(Math.max(...all));
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC instant → "YYYY-MM-DDTHH:mm" in LA (for datetime-local inputs, etc.). */
export function utcToLaWallTime(date: Date | string | number): string {
  const p = utcToLaParts(date);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}`;
}

export type LaDateFormat =
  /** "Saturday, December 5" */
  | "date"
  /** "Saturday, December 5, 2026" */
  | "dateYear"
  /** "7:00 PM PT" */
  | "time"
  /** "Saturday, December 5 · 7:00 PM PT" */
  | "dateTime"
  /** "Dec 5, 2026" */
  | "short"
  /** "Dec 5" */
  | "shortNoYear"
  /** "December 2026" */
  | "monthYear";

export interface FormatLaDateOptions {
  format?: LaDateFormat;
  /** Append " PT" to times (default true). */
  zoneLabel?: boolean;
}

function formatClock(p: LaParts): string {
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return `${h12}:${pad2(p.minute)} ${p.hour < 12 ? "AM" : "PM"}`;
}

/**
 * Format a UTC instant as LA wall time. Built from parts (not toLocaleString)
 * so output is identical on server and client — no ICU-version spacing
 * differences, no hydration mismatches.
 */
export function formatLaDate(dateUtc: Date | string | number, opts: FormatLaDateOptions = {}): string {
  const p = utcToLaParts(dateUtc);
  const zone = opts.zoneLabel === false ? "" : " PT";
  const dayLong = `${WEEKDAYS[p.weekday]}, ${MONTHS[p.month - 1]} ${p.day}`;
  switch (opts.format ?? "date") {
    case "date":
      return dayLong;
    case "dateYear":
      return `${dayLong}, ${p.year}`;
    case "time":
      return `${formatClock(p)}${zone}`;
    case "dateTime":
      return `${dayLong} · ${formatClock(p)}${zone}`;
    case "short":
      return `${MONTHS_SHORT[p.month - 1]} ${p.day}, ${p.year}`;
    case "shortNoYear":
      return `${MONTHS_SHORT[p.month - 1]} ${p.day}`;
    case "monthYear":
      return `${MONTHS[p.month - 1]} ${p.year}`;
  }
}

/** "6:00 – 10:00 PM PT" (or "11:00 AM – 2:00 PM PT"). */
export function formatLaTimeRange(startUtc: Date | string | number, endUtc: Date | string | number): string {
  const a = utcToLaParts(startUtc);
  const b = utcToLaParts(endUtc);
  const sameMeridiem = (a.hour < 12) === (b.hour < 12);
  const start = sameMeridiem ? formatClock(a).replace(/ (AM|PM)$/, "") : formatClock(a);
  return `${start} – ${formatClock(b)} PT`;
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Real elapsed milliseconds remaining (DST-independent), clamped at 0. */
  totalMs: number;
  isPast: boolean;
}

/**
 * Time remaining until `targetUtcMs`. Uses real elapsed time, so a countdown
 * across a DST change is exact (e.g. LA midnight→midnight on fall-back day is 25h).
 */
export function getCountdown(targetUtcMs: number, nowMs: number = Date.now()): Countdown {
  if (!Number.isFinite(targetUtcMs) || !Number.isFinite(nowMs)) {
    throw new RangeError("getCountdown expects finite millisecond timestamps");
  }
  const totalMs = Math.max(0, targetUtcMs - nowMs);
  const totalSec = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSec / 86_400),
    hours: Math.floor((totalSec % 86_400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    totalMs,
    isPast: totalMs === 0,
  };
}
