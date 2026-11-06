import styles from "./CCMark.module.css";

/**
 * The CC monogram, tinted with currentColor via CSS mask so a single SVG
 * master (public/assets/logo/cc-monogram.svg) drives every placement.
 */
export function CCMark({ className = "", label = "Coffee & Cannabis Club" }: { className?: string; label?: string | null }) {
  return label ? (
    <span role="img" aria-label={label} className={`${styles.mark} ${className}`} />
  ) : (
    <span aria-hidden="true" className={`${styles.mark} ${className}`} />
  );
}
