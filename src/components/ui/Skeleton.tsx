import styles from "./Skeleton.module.css";

interface Props {
  /** CSS length, e.g. "60%" or "12rem". Defaults to 100%. */
  width?: string;
  /** CSS length. Defaults to 1em (one line of the current text size). */
  height?: string;
  radius?: string;
  className?: string;
}

/** One shimmering placeholder block. Decorative: wrap groups in <LoadingRegion>. */
export function Skeleton({ width = "100%", height = "1em", radius, className = "" }: Props) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

/** A few lines of placeholder body text; the last line is shorter. */
export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <span className={`${styles.text} ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "62%" : "100%"} height="0.9em" />
      ))}
    </span>
  );
}

/**
 * Accessible wrapper for skeleton groups: announced once as busy, the blocks
 * themselves are hidden from assistive tech.
 */
export function LoadingRegion({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className} role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
