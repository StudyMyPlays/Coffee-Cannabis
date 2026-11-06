/** Display formatting, always in Los Angeles time (labeled PT). Client-safe. */
const TZ = "America/Los_Angeles";

const dShort = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" });
const dLong = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });
const dYear = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "long", day: "numeric", year: "numeric" });
const t = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

export const fmtShortDate = (d: Date | string) => dShort.format(new Date(d));
export const fmtLongDate = (d: Date | string) => dLong.format(new Date(d));
export const fmtDateYear = (d: Date | string) => dYear.format(new Date(d));
export const fmtTime = (d: Date | string) => `${t.format(new Date(d))} PT`;
export const fmtTimeRange = (a: Date | string, b: Date | string) =>
  `${t.format(new Date(a))} – ${t.format(new Date(b))} PT`;
export const pad2 = (n: number) => String(n).padStart(2, "0");
