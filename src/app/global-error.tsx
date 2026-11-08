"use client"; // Error boundaries must be Client Components

import "./globals.css";

/**
 * Last-resort fallback when the root layout itself fails. Renders its own
 * document (no header, footer or web fonts), so it stays deliberately simple.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  console.error(error);
  return (
    <html lang="en">
      <body>
        <title>Something went wrong · Coffee &amp; Cannabis Club</title>
        <main
          id="main"
          className="container"
          style={{ minHeight: "100svh", display: "grid", alignContent: "center", gap: "var(--space-5)", justifyItems: "start" }}
        >
          <p className="eyebrow">Something went wrong</p>
          <h1 className="display" style={{ fontSize: "var(--step-5)" }}>
            The club is <em>catching its breath.</em>
          </h1>
          <p className="muted">Please try again in a moment.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <button type="button" className="btn" onClick={() => retry()}>
              Try again
            </button>
            {/* Plain anchor: the app shell is down, so do a full reload home. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="btn btn--ghost">
              Back to the club
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
