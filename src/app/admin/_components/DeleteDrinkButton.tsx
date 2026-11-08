"use client";

import { useActionState } from "react";
import { deleteDrinkAction, type FormState } from "../actions";
import styles from "../admin.module.css";

export function DeleteDrinkButton({ slug, name, disabled }: { slug: string; name: string; disabled: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteDrinkAction, { nonce: 0 });
  return (
    <form
      action={action}
      onSubmit={(ev) => {
        if (!window.confirm(`Delete "${name}"? This can't be undone.`)) ev.preventDefault();
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      {state.message && (
        <p className={styles.bannerError} role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" className={styles.buttonDanger} disabled={pending || disabled} aria-busy={pending}>
        {pending && <span className="spinner" aria-hidden="true" />}
        {pending ? "Deleting…" : "Delete this drink"}
      </button>
    </form>
  );
}
