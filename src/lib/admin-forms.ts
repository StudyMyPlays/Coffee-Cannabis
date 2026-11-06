/**
 * Parse admin CMS form submissions into domain objects. Pure (no node APIs).
 * Returns either the parsed value or a field → message map.
 */
import { z } from "zod";
import type { Drink, Gathering, GatheringRecap, LatLng, MediaItem, Quote } from "./data/types.ts";
import { isValidLaWallTime, laWallTimeToUtc } from "./time.ts";
import { fieldErrors } from "./validation.ts";

export type FormResult<T> = { ok: true; value: T } | { ok: false; fieldErrors: Record<string, string> };

/** FormData → plain record of strings (checkboxes: "on" when checked, absent otherwise). */
export function formToRecord(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !k.startsWith("$ACTION")) out[k] = v;
  return out;
}

const str = (max: number) => z.string().trim().max(max, { error: `Keep this under ${max} characters.` });
const req = (max: number, label: string) => str(max).min(1, { error: `${label} is required.` });
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
const blankToNull = (v: unknown) => (v == null || (typeof v === "string" && v.trim() === "") ? null : v);
const optText = (max: number) => z.preprocess(blankToNull, str(max).nullable());

/** datetime-local gives "YYYY-MM-DDTHH:mm" (sometimes with ":ss"); keep minutes. */
const wallTime = (label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim().slice(0, 16) : v),
    z.string().refine(isValidLaWallTime, { error: `${label}: enter a valid date and time.` }),
  );
const optWallTime = (label: string) =>
  z.preprocess(
    (v) => {
      const b = blankToNull(v);
      return typeof b === "string" ? b.trim().slice(0, 16) : b;
    },
    z.string().refine(isValidLaWallTime, { error: `${label}: enter a valid date and time.` }).nullable(),
  );

const coord = (min: number, max: number) =>
  z.preprocess(
    (v) => {
      const b = blankToNull(v);
      return typeof b === "string" ? Number(b) : b;
    },
    z.number({ error: "Enter a number." }).min(min, { error: `Must be ≥ ${min}.` }).max(max, { error: `Must be ≤ ${max}.` }).nullable(),
  );

function pair(lat: number | null, lng: number | null): LatLng | null | "partial" {
  if (lat == null && lng == null) return null;
  if (lat == null || lng == null) return "partial";
  return { lat, lng };
}

/** "Quote — Name" per line (also accepts " - " or " – "). */
export function parseQuotes(text: string): Quote[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = /^(.*\S)\s+[—–-]\s+(\S.*)$/.exec(line);
      const raw = m ? m[1]! : line;
      return { text: raw.replace(/^["“]|["”]$/g, "").trim(), name: m ? m[2]!.trim() : "" };
    });
}

export function formatQuotes(quotes: Quote[]): string {
  return quotes.map((q) => (q.name ? `${q.text} — ${q.name}` : q.text)).join("\n");
}

/** "src | alt" per line. */
export function parsePhotos(text: string): MediaItem[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf("|");
      return i === -1 ? { src: line, alt: "" } : { src: line.slice(0, i).trim(), alt: line.slice(i + 1).trim() };
    });
}

export function formatPhotos(photos: MediaItem[]): string {
  return photos.map((p) => `${p.src} | ${p.alt}`).join("\n");
}

export const lines = (text: string) => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

const gatheringFormSchema = z.object({
  id: z.string().trim().max(100).default(""),
  title: req(120, "Title"),
  number: z.coerce.number({ error: "Enter a number." }).int({ error: "Whole numbers only." }).min(0).max(9999),
  slug: req(80, "Slug").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Lowercase letters, numbers and dashes only." }),
  description: str(2000).default(""),
  neighborhood: optText(80),
  neighborhoodLat: coord(-90, 90),
  neighborhoodLng: coord(-180, 180),
  startsAt: wallTime("Start"),
  endsAt: wallTime("End"),
  capacity: z.coerce.number({ error: "Enter a number." }).int({ error: "Whole numbers only." }).min(0).max(10000),
  status: z.enum(["draft", "upcoming", "past", "cancelled"], { error: "Choose a status." }),
  address: optText(300),
  venueLat: coord(-90, 90),
  venueLng: coord(-180, 180),
  addressReleased: checkbox,
  addressReleaseAt: optWallTime("Release time"),
  drinkSlug: optText(80),
  isPlaceholder: checkbox,
  recapSummary: str(4000).default(""),
  recapQuotes: str(8000).default(""),
  recapPlaylistUrl: z.preprocess(
    blankToNull,
    z.url({ error: "Enter a full URL (https://…)." }).nullable(),
  ),
  recapPhotos: str(8000).default(""),
});

export function parseGatheringForm(
  record: Record<string, string>,
  existing: Gathering | null,
): FormResult<Gathering> {
  const parsed = gatheringFormSchema.safeParse(record);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const f = parsed.data;
  const errors: Record<string, string> = {};

  if (laWallTimeToUtc(f.endsAt).getTime() <= laWallTimeToUtc(f.startsAt).getTime()) {
    errors.endsAt = "End must be after the start.";
  }
  const nc = pair(f.neighborhoodLat, f.neighborhoodLng);
  if (nc === "partial") errors.neighborhoodLat = "Enter both latitude and longitude, or leave both blank.";
  const vc = pair(f.venueLat, f.venueLng);
  if (vc === "partial") errors.venueLat = "Enter both latitude and longitude, or leave both blank.";
  if (f.addressReleased && !f.address) errors.address = "Add the address before releasing it.";

  const photos = parsePhotos(f.recapPhotos);
  if (photos.some((p) => !p.src || !p.alt)) errors.recapPhotos = 'Each line needs "image | description".';
  const quotes = parseQuotes(f.recapQuotes);

  if (Object.keys(errors).length) return { ok: false, fieldErrors: errors };

  const hasRecap = f.recapSummary || quotes.length || photos.length || f.recapPlaylistUrl;
  const recap: GatheringRecap | null = hasRecap
    ? { summary: f.recapSummary, quotes, playlistUrl: f.recapPlaylistUrl, photos }
    : null;

  return {
    ok: true,
    value: {
      id: existing?.id ?? f.id,
      slug: f.slug,
      number: f.number,
      title: f.title,
      description: f.description,
      neighborhood: f.neighborhood,
      neighborhoodCenter: nc as LatLng | null,
      startsAt: f.startsAt,
      endsAt: f.endsAt,
      capacity: f.capacity,
      status: f.status,
      address: f.address,
      venueLocation: vc as LatLng | null,
      addressReleased: f.addressReleased,
      addressReleaseAt: f.addressReleaseAt,
      drinkSlug: f.drinkSlug,
      recap,
      isPlaceholder: f.isPlaceholder,
      updatedAt: existing?.updatedAt ?? "",
    },
  };
}

const drinkFormSchema = z.object({
  slug: req(60, "Slug").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Lowercase letters, numbers and dashes only." }),
  name: req(60, "Name"),
  trademark: checkbox,
  role: str(60).default(""),
  profile: str(120).default(""),
  tagline: str(120).default(""),
  sensory: str(600).default(""),
  notes: str(2000).default(""),
  image: optText(500),
  imageAlt: str(200).default(""),
  accent: z
    .string()
    .trim()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, { error: "Use a hex color like #8db35a." }),
  order: z.coerce.number({ error: "Enter a number." }).int().min(0).max(999),
  seasonal: checkbox,
  active: checkbox,
  secret: checkbox,
  addOnNote: optText(300),
  legalReviewed: checkbox,
});

export function parseDrinkForm(record: Record<string, string>, existing: Drink | null): FormResult<Drink> {
  const parsed = drinkFormSchema.safeParse(existing ? { ...record, slug: existing.slug } : record);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const f = parsed.data;
  if (f.image && f.image.length > 0 && !f.imageAlt) {
    return { ok: false, fieldErrors: { imageAlt: "Describe the image for screen readers." } };
  }
  return {
    ok: true,
    value: {
      slug: f.slug,
      name: f.name,
      trademark: f.trademark,
      role: f.role,
      profile: f.profile,
      tagline: f.tagline,
      sensory: f.sensory,
      notes: lines(f.notes),
      image: f.image,
      imageAlt: f.imageAlt,
      accent: f.accent,
      order: f.order,
      founding: existing?.founding ?? false,
      secret: f.secret,
      seasonal: f.seasonal,
      active: f.active,
      addOnNote: f.addOnNote,
      // Approval only means something when there is wording to approve.
      legalReviewed: Boolean(f.addOnNote) && f.legalReviewed,
    },
  };
}

/* --------------------- domain → form default values --------------------- */

const s = (v: number | string | null | undefined) => (v == null ? "" : String(v));
const cb = (v: boolean) => (v ? "on" : "");

export function gatheringToFormValues(g: Gathering | null, defaults: Partial<Gathering> = {}): Record<string, string> {
  const x = g ?? (defaults as Gathering);
  return {
    id: s(g?.id),
    title: s(x.title),
    number: s(x.number),
    slug: s(x.slug),
    description: s(x.description),
    neighborhood: s(x.neighborhood),
    neighborhoodLat: s(x.neighborhoodCenter?.lat),
    neighborhoodLng: s(x.neighborhoodCenter?.lng),
    startsAt: s(x.startsAt),
    endsAt: s(x.endsAt),
    capacity: s(x.capacity),
    status: s(x.status ?? "draft"),
    address: s(x.address),
    venueLat: s(x.venueLocation?.lat),
    venueLng: s(x.venueLocation?.lng),
    addressReleased: cb(Boolean(x.addressReleased)),
    addressReleaseAt: s(x.addressReleaseAt),
    drinkSlug: s(x.drinkSlug),
    isPlaceholder: cb(Boolean(x.isPlaceholder)),
    recapSummary: s(x.recap?.summary),
    recapQuotes: x.recap ? formatQuotes(x.recap.quotes) : "",
    recapPlaylistUrl: s(x.recap?.playlistUrl),
    recapPhotos: x.recap ? formatPhotos(x.recap.photos) : "",
  };
}

export function drinkToFormValues(d: Drink | null, defaults: Partial<Drink> = {}): Record<string, string> {
  const x = d ?? (defaults as Drink);
  return {
    isNew: d ? "" : "1",
    slug: s(x.slug),
    name: s(x.name),
    trademark: cb(Boolean(x.trademark)),
    role: s(x.role),
    profile: s(x.profile),
    tagline: s(x.tagline),
    sensory: s(x.sensory),
    notes: (x.notes ?? []).join("\n"),
    image: s(x.image),
    imageAlt: s(x.imageAlt),
    accent: s(x.accent ?? "#8db35a"),
    order: s(x.order),
    seasonal: cb(Boolean(x.seasonal)),
    active: cb(Boolean(x.active)),
    secret: cb(Boolean(x.secret)),
    addOnNote: s(x.addOnNote),
    legalReviewed: cb(Boolean(x.legalReviewed)),
  };
}
