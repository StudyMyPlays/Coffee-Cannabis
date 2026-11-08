"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PageHero } from "@/components/page/PageHero";
import pageStyles from "@/components/page/Page.module.css";
import styles from "./ErrorState.module.css";

/**
 * Branded fallback for route errors. Offers a retry (re-renders the failed
 * segment) and a way home; shows the server digest as a reference code so the
 * team can match it to logs, never the raw message.
 */
export function ErrorState({ error, retry }: { error: unknown; retry: () => void }) {
  const [retrying, setRetrying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;

  useEffect(() => {
    console.error(error);
    ref.current?.focus();
  }, [error]);

  const onRetry = () => {
    setRetrying(true);
    retry();
    // If the segment fails again this boundary re-renders with a new error;
    // release the button so another attempt is possible.
    window.setTimeout(() => setRetrying(false), 1200);
  };

  return (
    <>
      <PageHero eyebrow="Something went wrong" title={<>This page didn&rsquo;t <em>pour right.</em></>}>
        <p>Something on our side hiccuped. It&rsquo;s usually temporary.</p>
      </PageHero>
      <section className={pageStyles.body}>
        <div className="container">
          <div ref={ref} tabIndex={-1} role="alert" className={`${styles.box} state-enter`}>
            <p>Try again in a moment. If it keeps happening, head back to the club and come in another way.</p>
            <div className={styles.actions}>
              <button type="button" className="btn" onClick={onRetry} disabled={retrying} aria-busy={retrying}>
                {retrying && <span className="spinner" aria-hidden="true" />}
                {retrying ? "Trying again…" : "Try again"}
              </button>
              <Link href="/" className="btn btn--ghost">
                Back to the club
              </Link>
            </div>
            {digest && <p className={styles.ref}>Reference: {digest}</p>}
          </div>
        </div>
      </section>
    </>
  );
}
