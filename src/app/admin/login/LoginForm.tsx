"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "../actions";
import styles from "../admin.module.css";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, { nonce: 0 });
  return (
    <form action={action} className={styles.form} noValidate>
      {state.message && (
        <p className={styles.bannerError} role="alert">
          {state.message}
        </p>
      )}
      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Team password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className={styles.input}
        />
      </div>
      <div className={styles.actions}>
        <button type="submit" className={styles.button} disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
