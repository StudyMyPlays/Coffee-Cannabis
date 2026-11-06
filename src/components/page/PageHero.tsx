import { PaisleyDivider } from "@/components/paisley";
import styles from "./Page.module.css";

/** Compact header for supporting pages. */
export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className={styles.hero}>
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className={`display ${styles.title}`}>{title}</h1>
        {children && <div className={styles.intro}>{children}</div>}
        <PaisleyDivider className={styles.divider} />
      </div>
    </header>
  );
}
