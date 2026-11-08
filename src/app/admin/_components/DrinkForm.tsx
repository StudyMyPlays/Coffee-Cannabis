"use client";

import { useActionState, useState } from "react";
import { saveDrinkAction, type FormState } from "../actions";
import { Checkbox, TextArea, TextField } from "./fields";
import styles from "../admin.module.css";

export function DrinkForm({
  initial,
  isNew,
  founding,
  readOnly,
}: {
  initial: Record<string, string>;
  isNew: boolean;
  founding: boolean;
  readOnly: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveDrinkAction, { nonce: 0 });
  const v = state.values ?? initial;
  const e = state.fieldErrors ?? {};
  const on = (k: string) => v[k] === "on" || v[k] === "true";

  return (
    <form key={state.nonce} action={action} className={styles.form} noValidate>
      <input type="hidden" name="isNew" value={isNew ? "1" : ""} />
      {state.message && (
        <p className={state.fieldErrors ? styles.bannerError : styles.bannerWarn} role="alert">
          {state.message}
        </p>
      )}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Identity</legend>
        <div className={styles.grid2}>
          <TextField name="name" label="Name" required defaultValue={v.name} error={e.name} />
          <TextField
            name="slug"
            label="Slug (URL name)"
            required
            readOnly={!isNew}
            defaultValue={v.slug}
            error={e.slug}
            hint={isNew ? "Lowercase letters, numbers, dashes. Can't be changed later." : "Permanent."}
          />
        </div>
        <div className={styles.grid3}>
          <TextField name="role" label="Role" defaultValue={v.role} error={e.role} hint='e.g. "Flagship", "Seasonal"' />
          <TextField name="profile" label="Profile" defaultValue={v.profile} error={e.profile} hint='e.g. "Pistachio ceremonial matcha"' />
          <TextField name="tagline" label="Tagline" defaultValue={v.tagline} error={e.tagline} hint='e.g. "Beauty. Ritual."' />
        </div>
        <Checkbox name="trademark" label="Show ™ after the name" defaultChecked={on("trademark")} />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Copy</legend>
        <TextArea
          name="sensory"
          label="Sensory description"
          rows={3}
          defaultValue={v.sensory}
          error={e.sensory}
          hint="1–2 sentences about taste, texture and mood. No health, wellness, energy or medical claims."
        />
        <TextArea name="notes" label="Notes / components" rows={5} defaultValue={v.notes} error={e.notes} hint="One per line." />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Look</legend>
        <div className={styles.grid2}>
          <TextField name="image" label="Image" defaultValue={v.image} error={e.image} hint='Asset name (e.g. "drink-green-goddess") or a full image URL.' />
          <TextField name="imageAlt" label="Image description (alt text)" defaultValue={v.imageAlt} error={e.imageAlt} />
        </div>
        <AccentField defaultValue={v.accent ?? ""} error={e.accent} />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Placement</legend>
        <TextField name="order" label="Order" type="number" min={0} required defaultValue={v.order} error={e.order} hint="Lower numbers show first." />
        <Checkbox name="active" label="Active (shown on the site)" defaultChecked={on("active")} />
        <Checkbox name="seasonal" label="Seasonal" defaultChecked={on("seasonal")} />
        <Checkbox name="secret" label="Secret (hidden from the menu; revealed by interaction)" defaultChecked={on("secret")} />
      </fieldset>

      <fieldset className={`${styles.fieldset} ${styles.fieldsetPrivate}`}>
        <legend className={styles.legend}>Add-on language (legal review required)</legend>
        <TextArea
          name="addOnNote"
          label="Add-on note"
          rows={2}
          defaultValue={v.addOnNote}
          error={e.addOnNote}
          hint="Stays hidden on the site until the box below is checked. If you change the wording, have it reviewed again."
        />
        <Checkbox
          name="legalReviewed"
          label="Legal review complete — publish add-on language"
          defaultChecked={on("legalReviewed")}
        />
      </fieldset>

      <div className={styles.stickyBar}>
        <span className={styles.muted}>
          {readOnly ? "Saving is disabled on this host." : founding ? "Founding Five — permanent." : "Changes go live as soon as you save."}
        </span>
        <button type="submit" className={styles.button} disabled={pending || readOnly} aria-busy={pending}>
          {pending && <span className="spinner" aria-hidden="true" />}
          {pending ? "Saving…" : isNew ? "Create drink" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function AccentField({ defaultValue, error }: { defaultValue: string; error?: string }) {
  const [color, setColor] = useState(defaultValue || "#8db35a");
  const valid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);
  return (
    <div className={styles.field}>
      <label htmlFor="accent" className={styles.label}>
        Accent color
      </label>
      <div className={styles.colorRow}>
        <span className={styles.swatch} style={{ background: valid ? color : "transparent" }} aria-hidden />
        <input
          id="accent"
          name="accent"
          className={styles.input}
          value={color}
          onChange={(ev) => setColor(ev.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby="accent-hint"
        />
        <input
          type="color"
          aria-label="Pick accent color"
          value={valid && color.length === 7 ? color : "#8db35a"}
          onChange={(ev) => setColor(ev.target.value)}
          className={styles.swatch}
        />
      </div>
      <span id="accent-hint" className={styles.hint}>
        Hex color, e.g. #8db35a.
      </span>
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
