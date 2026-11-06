/**
 * Local file adapter (server-only: uses node:fs).
 *
 * - CONTENT (gatherings, drinks): git-tracked JSON in `content/`. Edited via
 *   the admin locally, or directly in GitHub (which triggers a redeploy).
 * - RUNTIME data (members, RSVPs, notification markers): `.data/` (gitignored).
 *
 * On a read-only host (Vercel serverless), content is read-only
 * (`contentWritable=false`) and runtime data falls back to
 * `os.tmpdir()/ccc-data`, which is EPHEMERAL and per-instance. Connect a real
 * database adapter (see ./index.ts) before relying on RSVPs/members in prod.
 *
 * All mutations go through one in-process async mutex per data directory, so
 * concurrent RSVPs cannot oversell capacity *within one process*. (Multiple
 * serverless instances do not share a lock or files — another reason to use a
 * database in production.)
 */
import { promises as fsp, accessSync, mkdirSync, constants as fsConstants } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";

import type {
  CancelRsvpResult,
  CreateMemberResult,
  CreateRsvpResult,
  DataAdapter,
  Drink,
  Gathering,
  Member,
  MemberSignupInput,
  Rsvp,
  RsvpCounts,
} from "./types.ts";
import { ContentReadOnlyError, FoundingDrinkError, NotFoundError } from "./errors.ts";
import { laWallTimeToUtc } from "../time.ts";

/* ----------------------------- mutex ----------------------------------- */

class Mutex {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.tail.then(fn, fn);
    // Keep the chain alive regardless of failures.
    this.tail = next.catch(() => undefined);
    return next;
  }
}

// Shared across module instances (Next may load a module in several layers).
const g = globalThis as unknown as { __cccLocks?: Map<string, Mutex>; __cccEphemeralWarned?: boolean };
function lockFor(key: string): Mutex {
  g.__cccLocks ??= new Map();
  let m = g.__cccLocks.get(key);
  if (!m) {
    m = new Mutex();
    g.__cccLocks.set(key, m);
  }
  return m;
}

/* ----------------------------- file io --------------------------------- */

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fsp.readFile(file, "utf8");
    return raw.trim() ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw e;
  }
}

/** Atomic write: temp file in the same directory, then rename over target. */
async function writeJsonAtomic(file: string, data: unknown): Promise<void> {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    await fsp.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
    await fsp.rename(tmp, file);
  } catch (e) {
    await fsp.rm(tmp, { force: true }).catch(() => undefined);
    throw e;
  }
}

function isWritableDir(dir: string): boolean {
  try {
    mkdirSync(dir, { recursive: true });
    accessSync(dir, fsConstants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/* ----------------------------- helpers --------------------------------- */

const normEmail = (e: string) => e.trim().toLowerCase();
const nowIso = () => new Date().toISOString();
/** 32 random bytes, base64url → 43 chars. */
export const newCancelToken = () => randomBytes(32).toString("base64url");

function byCreated(a: { createdAt: string }, b: { createdAt: string }) {
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

function countsFor(rsvps: Rsvp[], gatheringId: string): RsvpCounts {
  let confirmed = 0;
  let waitlist = 0;
  for (const r of rsvps) {
    if (r.gatheringId !== gatheringId) continue;
    if (r.status === "confirmed") confirmed++;
    else if (r.status === "waitlist") waitlist++;
  }
  return { confirmed, waitlist };
}

/* ----------------------------- adapter --------------------------------- */

export interface LocalAdapterOptions {
  /** Directory holding gatherings.json / drinks.json. Default: <cwd>/content */
  contentDir?: string;
  /** Directory for members/rsvps when writable. Default: <cwd>/.data */
  runtimeDir?: string;
  /** Override writability detection (tests). */
  contentWritable?: boolean;
  /** Suppress the ephemeral-storage warning (tests). */
  quiet?: boolean;
}

interface Markers {
  [key: string]: string;
}

export class LocalAdapter implements DataAdapter {
  readonly name = "local";
  readonly contentWritable: boolean;
  /** Where members/RSVPs are actually stored. */
  readonly runtimeDir: string;
  readonly runtimeIsEphemeral: boolean;
  private readonly contentDir: string;
  private readonly lock: Mutex;

  constructor(opts: LocalAdapterOptions = {}) {
    const cwd = process.cwd();
    this.contentDir = opts.contentDir ?? path.join(cwd, "content");
    const preferredRuntime = opts.runtimeDir ?? path.join(cwd, ".data");

    const onVercel = Boolean(process.env.VERCEL);
    this.contentWritable = opts.contentWritable ?? (!onVercel && isWritableDir(this.contentDir));

    if (this.contentWritable && isWritableDir(preferredRuntime)) {
      this.runtimeDir = preferredRuntime;
      this.runtimeIsEphemeral = false;
    } else {
      this.runtimeDir = path.join(os.tmpdir(), "ccc-data");
      this.runtimeIsEphemeral = true;
      if (!opts.quiet && !g.__cccEphemeralWarned) {
        g.__cccEphemeralWarned = true;
        console.warn(
          `[data] Content directory is read-only on this host. Gatherings/drinks are read-only, and members/RSVPs ` +
            `are being written to ${this.runtimeDir} — this storage is EPHEMERAL (lost on redeploy/cold start, not ` +
            `shared between instances). Connect a database adapter (DATA_ADAPTER) before collecting real sign-ups.`,
        );
      }
    }
    this.lock = lockFor(this.runtimeDir + "|" + this.contentDir);
  }

  private file(kind: "gatherings" | "drinks" | "members" | "rsvps" | "markers"): string {
    return kind === "gatherings" || kind === "drinks"
      ? path.join(this.contentDir, `${kind}.json`)
      : path.join(this.runtimeDir, `${kind}.json`);
  }

  private assertContentWritable() {
    if (!this.contentWritable) throw new ContentReadOnlyError();
  }

  /* ---------- gatherings ---------- */

  async listGatherings(): Promise<Gathering[]> {
    const list = await readJson<Gathering[]>(this.file("gatherings"), []);
    return list.slice().sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  async getGathering(idOrSlug: string): Promise<Gathering | null> {
    const list = await this.listGatherings();
    return list.find((x) => x.id === idOrSlug) ?? list.find((x) => x.slug === idOrSlug) ?? null;
  }

  upsertGathering(input: Gathering): Promise<Gathering> {
    return this.lock.run(async () => {
      this.assertContentWritable();
      const list = await readJson<Gathering[]>(this.file("gatherings"), []);
      const saved: Gathering = { ...input, id: input.id || randomUUID(), updatedAt: nowIso() };
      const i = list.findIndex((x) => x.id === saved.id);
      if (i >= 0) list[i] = saved;
      else list.push(saved);
      list.sort((a, b) => a.number - b.number);
      await writeJsonAtomic(this.file("gatherings"), list);
      return saved;
    });
  }

  deleteGathering(id: string): Promise<void> {
    return this.lock.run(async () => {
      this.assertContentWritable();
      const list = await readJson<Gathering[]>(this.file("gatherings"), []);
      const next = list.filter((x) => x.id !== id);
      if (next.length === list.length) throw new NotFoundError("Gathering");
      await writeJsonAtomic(this.file("gatherings"), next);
    });
  }

  /* ---------- drinks ---------- */

  async listDrinks(): Promise<Drink[]> {
    const list = await readJson<Drink[]>(this.file("drinks"), []);
    return list.slice().sort((a, b) => a.order - b.order);
  }

  async getDrink(slug: string): Promise<Drink | null> {
    return (await this.listDrinks()).find((d) => d.slug === slug) ?? null;
  }

  upsertDrink(input: Drink): Promise<Drink> {
    return this.lock.run(async () => {
      this.assertContentWritable();
      const list = await readJson<Drink[]>(this.file("drinks"), []);
      const i = list.findIndex((d) => d.slug === input.slug);
      // Founding status is permanent: it can't be granted or removed via upsert.
      const saved: Drink = { ...input, founding: i >= 0 ? list[i]!.founding : false };
      if (i >= 0) list[i] = saved;
      else list.push(saved);
      list.sort((a, b) => a.order - b.order);
      await writeJsonAtomic(this.file("drinks"), list);
      return saved;
    });
  }

  deleteDrink(slug: string): Promise<void> {
    return this.lock.run(async () => {
      const list = await readJson<Drink[]>(this.file("drinks"), []);
      const d = list.find((x) => x.slug === slug);
      if (!d) throw new NotFoundError("Drink");
      if (d.founding) throw new FoundingDrinkError(slug);
      this.assertContentWritable();
      await writeJsonAtomic(this.file("drinks"), list.filter((x) => x.slug !== slug));
    });
  }

  /* ---------- members ---------- */

  createMember(input: MemberSignupInput): Promise<CreateMemberResult> {
    return this.lock.run(async () => {
      const members = await readJson<Member[]>(this.file("members"), []);
      const email = normEmail(input.email);
      const existing = members.find((m) => normEmail(m.email) === email);
      if (existing) return { status: "exists", member: existing };
      const foundingNumber = members.reduce((max, m) => Math.max(max, m.foundingNumber), 0) + 1;
      const member: Member = {
        name: input.name.trim(),
        email,
        ...(input.mobile ? { mobile: input.mobile } : {}),
        ...(input.zip ? { zip: input.zip } : {}),
        ...(input.instagram ? { instagram: input.instagram } : {}),
        ...(input.source ? { source: input.source } : {}),
        consent: true,
        id: randomUUID(),
        createdAt: nowIso(),
        foundingNumber,
      };
      members.push(member);
      await writeJsonAtomic(this.file("members"), members);
      return { status: "created", member };
    });
  }

  async countMembers(): Promise<number> {
    return (await readJson<Member[]>(this.file("members"), [])).length;
  }

  async listMembers(): Promise<Member[]> {
    return (await readJson<Member[]>(this.file("members"), [])).slice().sort(byCreated);
  }

  /* ---------- rsvps ---------- */

  createRsvp(gatheringId: string, input: { name: string; email: string }): Promise<CreateRsvpResult> {
    return this.lock.run(async () => {
      const gathering = await this.getGathering(gatheringId);
      if (!gathering) return { status: "closed", reason: "not_found" };
      if (gathering.status !== "upcoming") return { status: "closed", reason: gathering.status };
      if (laWallTimeToUtc(gathering.endsAt).getTime() <= Date.now()) return { status: "closed", reason: "past" };

      const rsvps = await readJson<Rsvp[]>(this.file("rsvps"), []);
      const email = normEmail(input.email);
      const dup = rsvps.find(
        (r) => r.gatheringId === gathering.id && r.status !== "cancelled" && normEmail(r.email) === email,
      );
      const before = countsFor(rsvps, gathering.id);
      if (dup) return { status: "duplicate", rsvp: dup, counts: before };

      const ts = nowIso();
      const status = before.confirmed < gathering.capacity ? "confirmed" : "waitlist";
      const rsvp: Rsvp = {
        id: randomUUID(),
        gatheringId: gathering.id,
        name: input.name.trim(),
        email,
        status,
        cancelToken: newCancelToken(),
        createdAt: ts,
        updatedAt: ts,
      };
      rsvps.push(rsvp);
      await writeJsonAtomic(this.file("rsvps"), rsvps);
      const counts = countsFor(rsvps, gathering.id);
      if (status === "confirmed") return { status, rsvp, counts };
      return { status, rsvp, position: counts.waitlist, counts };
    });
  }

  cancelRsvp(cancelToken: string): Promise<CancelRsvpResult | null> {
    return this.lock.run(async () => {
      if (!cancelToken) return null;
      const rsvps = await readJson<Rsvp[]>(this.file("rsvps"), []);
      const rsvp = rsvps.find((r) => r.cancelToken === cancelToken);
      if (!rsvp) return null;
      if (rsvp.status === "cancelled") return { rsvp, promoted: null };

      const wasConfirmed = rsvp.status === "confirmed";
      const ts = nowIso();
      rsvp.status = "cancelled";
      rsvp.updatedAt = ts;

      let promoted: Rsvp | null = null;
      if (wasConfirmed) {
        const gathering = await this.getGathering(rsvp.gatheringId);
        const capacity = gathering?.capacity ?? 0;
        const { confirmed } = countsFor(rsvps, rsvp.gatheringId);
        if (confirmed < capacity) {
          const head = rsvps
            .filter((r) => r.gatheringId === rsvp.gatheringId && r.status === "waitlist")
            .sort(byCreated)[0];
          if (head) {
            head.status = "confirmed";
            head.updatedAt = ts;
            promoted = head;
          }
        }
      }
      await writeJsonAtomic(this.file("rsvps"), rsvps);
      return { rsvp: { ...rsvp }, promoted: promoted ? { ...promoted } : null };
    });
  }

  async getRsvpByToken(cancelToken: string): Promise<Rsvp | null> {
    if (!cancelToken) return null;
    const rsvps = await readJson<Rsvp[]>(this.file("rsvps"), []);
    return rsvps.find((r) => r.cancelToken === cancelToken) ?? null;
  }

  async countRsvps(gatheringId: string): Promise<RsvpCounts> {
    return countsFor(await readJson<Rsvp[]>(this.file("rsvps"), []), gatheringId);
  }

  async listRsvps(gatheringId: string): Promise<Rsvp[]> {
    const rsvps = await readJson<Rsvp[]>(this.file("rsvps"), []);
    return rsvps.filter((r) => r.gatheringId === gatheringId).sort(byCreated);
  }

  /* ---------- notification markers ---------- */

  claimNotification(key: string): Promise<boolean> {
    return this.lock.run(async () => {
      const markers = await readJson<Markers>(this.file("markers"), {});
      if (markers[key]) return false;
      markers[key] = nowIso();
      await writeJsonAtomic(this.file("markers"), markers);
      return true;
    });
  }
}
