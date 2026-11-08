"use client";

import { useActionState } from "react";
import { saveGatheringAction, type FormState } from "../actions";
import { Checkbox, SelectField, TextArea, TextField } from "./fields";
import styles from "../admin.module.css";

export function GatheringForm({
  initial,
  drinks,
  isNew,
  readOnly,
}: {
  initial: Record<string, string>;
  drinks: Array<{ slug: string; name: string }>;
  isNew: boolean;
  readOnly: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveGatheringAction, { nonce: 0 });
  const v = state.values ?? initial;
  const e = state.fieldErrors ?? {};
  const on = (k: string) => v[k] === "on" || v[k] === "true";

  return (
    <form key={state.nonce} action={action} className={styles.form} noValidate>
      <input type="hidden" name="id" value={v.id ?? ""} />
      {state.message && (
        <p className={state.fieldErrors ? styles.bannerError : styles.bannerWarn} role="alert">
          {state.message}
        </p>
      )}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Basics</legend>
        <div className={styles.grid3}>
          <TextField name="number" label="Gathering number" type="number" min={0} required defaultValue={v.number} error={e.number} hint='Shown as "Gathering No. 01".' />
          <TextField name="title" label="Title" required defaultValue={v.title} error={e.title} />
          <TextField name="slug" label="Slug (URL name)" required defaultValue={v.slug} error={e.slug} hint="e.g. gathering-02 — lowercase, dashes." />
        </div>
        <TextArea name="description" label="Description" defaultValue={v.description} error={e.description} hint="Warm, short. Taste, music, people — no health or consumption claims." />
        <div className={styles.grid2}>
          <SelectField
            name="status"
            label="Status"
            defaultValue={v.status}
            error={e.status}
            hint="Draft = hidden. Upcoming = live with RSVPs. Past = shows in the archive. Cancelled = RSVPs closed."
            options={[
              { value: "draft", label: "Draft (hidden)" },
              { value: "upcoming", label: "Upcoming (live)" },
              { value: "past", label: "Past" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
          <TextField name="capacity" label="Capacity" type="number" min={0} required defaultValue={v.capacity} error={e.capacity} hint="Confirmed spots. Extra RSVPs join the waitlist." />
        </div>
        <Checkbox name="isPlaceholder" label='Sample content (shows a discreet "sample" label on the site)' defaultChecked={on("isPlaceholder")} />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>When — Los Angeles time</legend>
        <div className={styles.grid2}>
          <TextField name="startsAt" label="Starts (Los Angeles time)" type="datetime-local" required defaultValue={v.startsAt} error={e.startsAt} />
          <TextField name="endsAt" label="Ends (Los Angeles time)" type="datetime-local" required defaultValue={v.endsAt} error={e.endsAt} />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Neighborhood (public)</legend>
        <TextField name="neighborhood" label="Neighborhood" defaultValue={v.neighborhood} error={e.neighborhood} hint='Leave blank to show "Neighborhood: TBA".' />
        <div className={styles.grid2}>
          <TextField name="neighborhoodLat" label="Map center latitude" inputMode="decimal" defaultValue={v.neighborhoodLat} error={e.neighborhoodLat} hint="Approximate neighborhood center — never the venue." />
          <TextField name="neighborhoodLng" label="Map center longitude" inputMode="decimal" defaultValue={v.neighborhoodLng} error={e.neighborhoodLng} />
        </div>
      </fieldset>

      <fieldset className={`${styles.fieldset} ${styles.fieldsetPrivate}`}>
        <legend className={styles.legend}>Exact location (private until released)</legend>
        <TextField name="address" label="Venue address" defaultValue={v.address} error={e.address} hint="Hidden from the public site until released." />
        <div className={styles.grid2}>
          <TextField name="venueLat" label="Venue latitude" inputMode="decimal" defaultValue={v.venueLat} error={e.venueLat} />
          <TextField name="venueLng" label="Venue longitude" inputMode="decimal" defaultValue={v.venueLng} error={e.venueLng} />
        </div>
        <Checkbox
          name="addressReleased"
          label="Release the address now"
          defaultChecked={on("addressReleased")}
          error={e.addressReleased}
          hint="Turning this on publishes the address immediately and sends the location drop to confirmed guests."
        />
        <TextField
          name="addressReleaseAt"
          label="Or release automatically at (Los Angeles time)"
          type="datetime-local"
          defaultValue={v.addressReleaseAt}
          error={e.addressReleaseAt}
          hint="Optional. The site shows the address from this moment; the daily job sends the location drop."
        />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Drink of the gathering</legend>
        <SelectField
          name="drinkSlug"
          label="Drink"
          defaultValue={v.drinkSlug}
          error={e.drinkSlug}
          options={[{ value: "", label: "— None —" }, ...drinks.map((d) => ({ value: d.slug, label: d.name }))]}
        />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Recap (after the night)</legend>
        <TextArea name="recapSummary" label="Summary" defaultValue={v.recapSummary} error={e.recapSummary} />
        <TextArea name="recapQuotes" label="Quotes" defaultValue={v.recapQuotes} error={e.recapQuotes} hint="One per line: Quote — Name" />
        <TextField name="recapPlaylistUrl" label="Playlist URL" type="url" defaultValue={v.recapPlaylistUrl} error={e.recapPlaylistUrl} />
        <TextArea name="recapPhotos" label="Photos" defaultValue={v.recapPhotos} error={e.recapPhotos} hint="One per line: image path or URL | description of the photo" />
      </fieldset>

      <div className={styles.stickyBar}>
        <span className={styles.muted}>{readOnly ? "Saving is disabled on this host." : "Changes go live as soon as you save."}</span>
        <button type="submit" className={styles.button} disabled={pending || readOnly} aria-busy={pending}>
          {pending && <span className="spinner" aria-hidden="true" />}
          {pending ? "Saving…" : isNew ? "Create gathering" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
