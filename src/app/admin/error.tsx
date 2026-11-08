"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./admin.module.css";

export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;

  useEffect(() => {
    console.error(error);
    ref.current?.focus();
  }, [error]);

  return (
    <div ref={ref} tabIndex={-1} role="alert" className={`${styles.errorBox} state-enter`}>
      <p className={styles.eyebrow}>Something went wrong</p>
      <h1 className={styles.h1}>That didn&rsquo;t load.</h1>
      <p className={styles.muted}>
        Nothing was saved by this error. Try again; if it keeps happening, reload the dashboard.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={() => retry()}>
          Try again
        </button>
        <Link href="/admin" className={styles.buttonGhost}>
          Back to dashboard
        </Link>
      </div>
      {digest && <p className={styles.muted}>Reference: {digest}</p>}
    </div>
  );
}
