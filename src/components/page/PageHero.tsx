import { PaisleyDivider } from "@/components/paisley";
import styles from "./Page.module.css";

/** Order of each line in the CSS page intro (see [data-intro] in globals.css). */
const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** Compact header for supporting pages. */
export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className={styles.hero}>
      <div className="container">
        <p className="eyebrow" data-intro style={order(0)}>
          {eyebrow}
        </p>
        <h1 className={`display ${styles.title}`} data-intro style={order(1)}>
          {title}
        </h1>
        {children && (
          <div className={styles.intro} data-intro style={order(2)}>
            {children}
          </div>
        )}
        <div data-intro style={order(3)}>
          <PaisleyDivider className={styles.divider} />
        </div>
      </div>
    </header>
  );
}
