"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import {
  checkAdminPassword,
  clearAdminSessionCookie,
  isAdminEnabled,
  requestIp,
  requireAdmin,
  setAdminSessionCookie,
} from "@/lib/admin-auth";
import { formToRecord, parseDrinkForm, parseGatheringForm } from "@/lib/admin-forms";
import { getDataAdapter } from "@/lib/data";
import { isDataError } from "@/lib/data/errors";
import { isAddressReleased } from "@/lib/data/public";
import type { Gathering } from "@/lib/data/types";
import { notify } from "@/lib/notify";
import { broadcastRecipients, gatheringSummary, locationDropPayload } from "@/lib/notify-payloads";
import { rateLimitRoute } from "@/lib/spam";

export interface FormState {
  /** Changes on every submission so the form remounts with `values`. */
  nonce: number;
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

/* ------------------------------ auth ---------------------------------- */

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const nonce = Date.now();
  if (!isAdminEnabled()) return { nonce, message: "Admin is disabled: set ADMIN_PASSWORD." };
  const rl = rateLimitRoute("adminLogin", await requestIp());
  if (!rl.ok) return { nonce, message: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSec / 60)} min.` };
  const password = String(fd.get("password") ?? "");
  if (!checkAdminPassword(password)) return { nonce, message: "That password isn't right." };
  await setAdminSessionCookie();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}

/* ---------------------------- helpers --------------------------------- */

function revalidatePublic() {
  // Public routes are owned by the UI; revalidate the whole tree so every page
  // that shows gatherings/drinks picks up the change.
  revalidatePath("/", "layout");
}

const TRACKED_FIELDS: (keyof Gathering)[] = [
  "title", "number", "slug", "description", "neighborhood", "neighborhoodCenter", "startsAt", "endsAt",
  "capacity", "status", "address", "venueLocation", "addressReleased", "addressReleaseAt", "drinkSlug",
  "recap", "isPlaceholder",
];

function changedFields(a: Gathering, b: Gathering): string[] {
  return TRACKED_FIELDS.filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
}

function errorMessage(e: unknown): string {
  if (isDataError(e)) return e.message;
  console.error("[admin] save failed:", e);
  return "Couldn't save. Please try again.";
}

/* ---------------------------- gatherings ------------------------------ */

export async function saveGatheringAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const nonce = Date.now();
  const values = formToRecord(fd);
  const adapter = getDataAdapter();
  if (!adapter.contentWritable) {
    return { nonce, values, message: "Edits can't be saved on this host. Edit content/gatherings.json in GitHub or connect a database." };
  }

  const existing = values.id ? await adapter.getGathering(values.id) : null;
  if (values.id && !existing) return { nonce, values, message: "That gathering no longer exists." };

  const parsed = parseGatheringForm(values, existing);
  if (!parsed.ok) return { nonce, values, fieldErrors: parsed.fieldErrors, message: "Please fix the highlighted fields." };

  const all = await adapter.listGatherings();
  const others = all.filter((g) => g.id !== existing?.id);
  const errs: Record<string, string> = {};
  if (others.some((g) => g.slug === parsed.value.slug)) errs.slug = "Another gathering already uses this slug.";
  if (others.some((g) => g.number === parsed.value.number)) errs.number = "Another gathering already uses this number.";
  if (parsed.value.drinkSlug && !(await adapter.getDrink(parsed.value.drinkSlug))) errs.drinkSlug = "Unknown drink.";
  if (Object.keys(errs).length) return { nonce, values, fieldErrors: errs, message: "Please fix the highlighted fields." };

  let saved: Gathering;
  try {
    saved = await adapter.upsertGathering(parsed.value);
  } catch (e) {
    return { nonce, values, message: errorMessage(e) };
  }

  // Notifications (never block or fail the save).
  if (existing) {
    const now = Date.now();
    const flagFlipped = !existing.addressReleased && saved.addressReleased;
    const changes = changedFields(existing, saved);
    after(async () => {
      try {
        const rsvps = await adapter.listRsvps(saved.id);
        if (flagFlipped && !isAddressReleased(existing, now) && (await adapter.claimNotification(`location_drop:${saved.id}`))) {
          await notify("gathering.location_drop", locationDropPayload(saved, rsvps.filter((r) => r.status === "confirmed")));
        }
        const updateChanges = changes.filter((c) => !(flagFlipped && c === "addressReleased"));
        if (updateChanges.length) {
          await notify("gathering.updated", {
            gathering: gatheringSummary(saved),
            changedFields: updateChanges,
            recipients: broadcastRecipients(rsvps, ["confirmed", "waitlist"]),
          });
        }
      } catch (e) {
        console.error("[admin] post-save notifications failed:", e);
      }
    });
  }

  revalidatePublic();
  revalidatePath("/admin");
  redirect(`/admin/gatherings/${saved.id}?saved=1`);
}

/* ------------------------------ drinks -------------------------------- */

export async function saveDrinkAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const nonce = Date.now();
  const values = formToRecord(fd);
  const adapter = getDataAdapter();
  if (!adapter.contentWritable) {
    return { nonce, values, message: "Edits can't be saved on this host. Edit content/drinks.json in GitHub or connect a database." };
  }
  const isNew = values.isNew === "1";
  const existing = isNew ? null : await adapter.getDrink(values.slug ?? "");
  if (!isNew && !existing) return { nonce, values, message: "That drink no longer exists." };
  if (isNew && values.slug?.trim() === "new") {
    return { nonce, values, fieldErrors: { slug: '"new" is reserved — pick another slug.' }, message: "Please fix the highlighted fields." };
  }
  if (isNew && values.slug && (await adapter.getDrink(values.slug.trim()))) {
    return { nonce, values, fieldErrors: { slug: "A drink with this slug already exists." }, message: "Please fix the highlighted fields." };
  }

  const parsed = parseDrinkForm(values, existing);
  if (!parsed.ok) return { nonce, values, fieldErrors: parsed.fieldErrors, message: "Please fix the highlighted fields." };

  try {
    await adapter.upsertDrink(parsed.value);
  } catch (e) {
    return { nonce, values, message: errorMessage(e) };
  }
  revalidatePublic();
  revalidatePath("/admin");
  redirect(`/admin/drinks/${parsed.value.slug}?saved=1`);
}

export async function deleteDrinkAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const slug = String(fd.get("slug") ?? "");
  const adapter = getDataAdapter();
  const usedBy = (await adapter.listGatherings()).filter((g) => g.drinkSlug === slug);
  if (usedBy.length) {
    return {
      nonce: Date.now(),
      message: `This drink is the drink of ${usedBy.map((g) => g.title).join(", ")}. Choose a different drink there first.`,
    };
  }
  try {
    await adapter.deleteDrink(slug);
  } catch (e) {
    return { nonce: Date.now(), message: errorMessage(e) };
  }
  revalidatePublic();
  revalidatePath("/admin");
  redirect("/admin?deleted=1");
}
