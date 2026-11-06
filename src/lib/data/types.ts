/**
 * Domain types shared by UI, API routes and data adapters.
 * The UI only ever sees the "Public*" shapes; private fields (exact address,
 * attendee emails) never leave the server unless explicitly released.
 */

/** Wall-clock time in America/Los_Angeles, format "YYYY-MM-DDTHH:mm". */
export type LaWallTime = string;

export type GatheringStatus = "draft" | "upcoming" | "past" | "cancelled";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Quote {
  text: string;
  name: string;
}

export interface MediaItem {
  /** Stable project path (e.g. /assets/community-table.jpg) or absolute CDN URL. */
  src: string;
  alt: string;
}

export interface GatheringRecap {
  summary: string;
  quotes: Quote[];
  playlistUrl?: string | null;
  photos: MediaItem[];
}

export interface Gathering {
  id: string;
  slug: string;
  /** Sequential gathering number, e.g. 1 → "Gathering No. 01". */
  number: number;
  title: string;
  description: string;
  /** null → displayed as "Neighborhood: TBA". */
  neighborhood: string | null;
  /** Approximate neighborhood center for the map. Never the venue itself. */
  neighborhoodCenter: LatLng | null;
  startsAt: LaWallTime;
  endsAt: LaWallTime;
  capacity: number;
  status: GatheringStatus;
  /** PRIVATE until released. Never hard-code an invented address. */
  address: string | null;
  /** PRIVATE until released. Exact venue pin. */
  venueLocation: LatLng | null;
  /** Manual release flag. */
  addressReleased: boolean;
  /** Optional automatic release moment (LA wall time). */
  addressReleaseAt: LaWallTime | null;
  /** Slug of the drink of the gathering, if any. */
  drinkSlug: string | null;
  recap: GatheringRecap | null;
  /** Seed/sample content — UI shows a discreet "sample" label. */
  isPlaceholder: boolean;
  updatedAt: string;
}

/** What the browser receives. */
export interface PublicGathering
  extends Omit<Gathering, "address" | "venueLocation" | "addressReleaseAt"> {
  address: string | null; // only non-null when released
  venueLocation: LatLng | null; // only non-null when released
  addressIsReleased: boolean;
  /** ISO UTC instants derived from the LA wall time (DST-safe). */
  startsAtUtc: string;
  endsAtUtc: string;
  addressReleaseAtUtc: string | null;
  attendeeCount: number;
  waitlistCount: number;
  spotsLeft: number;
}

export interface Drink {
  slug: string;
  name: string;
  /** Show ™ after the name. */
  trademark: boolean;
  role: string; // "Flagship", "Viral", ...
  profile: string; // "Pistachio ceremonial matcha"
  tagline: string; // short line, e.g. "Beauty. Ritual."
  sensory: string; // 1–2 sentence sensory copy
  notes: string[]; // tasting notes / components
  /** Asset name from the manifest (e.g. "drink-green-goddess") or a URL. */
  image: string | null;
  imageAlt: string;
  accent: string; // CSS color
  order: number;
  /** Founding Five are persistent and cannot be deleted from the CMS. */
  founding: boolean;
  /** Hidden from the main list; revealed via interaction (Green Mile). */
  secret: boolean;
  seasonal: boolean;
  active: boolean;
  /**
   * Optional CBD / add-on language. LEGAL REVIEW REQUIRED before publishing.
   * Rendered only when `legalReviewed` is true.
   */
  addOnNote: string | null;
  legalReviewed: boolean;
}

export interface MemberSignupInput {
  name: string;
  email: string;
  mobile?: string;
  zip?: string;
  instagram?: string;
  consent: true;
  source?: string;
}

export interface Member extends MemberSignupInput {
  id: string;
  createdAt: string;
  foundingNumber: number;
}

export type RsvpStatus = "confirmed" | "waitlist" | "cancelled";

export interface Rsvp {
  id: string;
  gatheringId: string;
  name: string;
  email: string;
  status: RsvpStatus;
  /** Secret token emailed to the guest to cancel. */
  cancelToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface RsvpCounts {
  confirmed: number;
  waitlist: number;
}

export type CreateMemberResult =
  | { status: "created"; member: Member }
  | { status: "exists"; member: Member };

export type CreateRsvpResult =
  | { status: "confirmed"; rsvp: Rsvp; counts: RsvpCounts }
  | { status: "waitlist"; rsvp: Rsvp; position: number; counts: RsvpCounts }
  | { status: "duplicate"; rsvp: Rsvp; counts: RsvpCounts }
  | { status: "closed"; reason: "past" | "cancelled" | "draft" | "not_found" };

export interface CancelRsvpResult {
  rsvp: Rsvp;
  /** A waitlisted guest that was promoted into the freed spot, if any. */
  promoted: Rsvp | null;
}

/**
 * Backend adapter contract. Swap implementations (local file, Supabase, …)
 * without touching UI or route handlers. Selected in src/lib/data/index.ts.
 */
export interface DataAdapter {
  readonly name: string;
  /** False when content writes cannot persist (e.g. read-only serverless FS). */
  readonly contentWritable: boolean;

  listGatherings(): Promise<Gathering[]>;
  getGathering(idOrSlug: string): Promise<Gathering | null>;
  upsertGathering(g: Gathering): Promise<Gathering>;
  deleteGathering(id: string): Promise<void>;

  listDrinks(): Promise<Drink[]>;
  getDrink(slug: string): Promise<Drink | null>;
  upsertDrink(d: Drink): Promise<Drink>;
  /** Must refuse to delete Founding Five drinks. */
  deleteDrink(slug: string): Promise<void>;

  createMember(input: MemberSignupInput): Promise<CreateMemberResult>;
  countMembers(): Promise<number>;
  /** All members, oldest first (admin export only — never expose publicly). */
  listMembers(): Promise<Member[]>;

  /** Must be atomic with respect to capacity. */
  createRsvp(gatheringId: string, input: { name: string; email: string }): Promise<CreateRsvpResult>;
  /** Cancels and promotes the head of the waitlist into the freed spot. */
  cancelRsvp(cancelToken: string): Promise<CancelRsvpResult | null>;
  getRsvpByToken(cancelToken: string): Promise<Rsvp | null>;
  countRsvps(gatheringId: string): Promise<RsvpCounts>;
  listRsvps(gatheringId: string): Promise<Rsvp[]>;

  /**
   * Idempotency marker for one-off notifications (reminders, location drops).
   * Atomically records `key`; returns true the first time, false if it was
   * already claimed. Stored with runtime data.
   */
  claimNotification(key: string): Promise<boolean>;
}
