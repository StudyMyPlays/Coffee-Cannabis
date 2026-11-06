import type { CSSProperties, ReactNode } from "react";
import { PaisleyCorner } from "./PaisleyCorner";
import styles from "./PaisleyFrame.module.css";

export interface PaisleyFrameProps {
  className?: string;
  children?: ReactNode;
  /**
   * Padding between the frame and its content. Numbers are pixels; strings are
   * any CSS length. Defaults to 60% of the corner size.
   * Corner size itself is the CSS variable `--paisley-corner`; ornament colour
   * is `--paisley-color` (defaults to currentColor).
   */
  inset?: number | string;
}

const cx = (...names: Array<string | undefined | false>) => names.filter(Boolean).join(" ");

export function PaisleyFrame({ className, children, inset }: PaisleyFrameProps) {
  const style =
    inset === undefined
      ? undefined
      : ({ "--paisley-inset": typeof inset === "number" ? `${inset}px` : inset } as CSSProperties);

  return (
    <div className={cx(styles.frame, className)} style={style}>
      <span className={cx(styles.ornament, styles.rule, styles.ruleTop)} aria-hidden="true" />
      <span className={cx(styles.ornament, styles.rule, styles.ruleBottom)} aria-hidden="true" />
      <span className={cx(styles.ornament, styles.rule, styles.ruleLeft)} aria-hidden="true" />
      <span className={cx(styles.ornament, styles.rule, styles.ruleRight)} aria-hidden="true" />
      <PaisleyCorner position="tl" className={cx(styles.ornament, styles.corner, styles.tl)} />
      <PaisleyCorner position="tr" className={cx(styles.ornament, styles.corner, styles.tr)} />
      <PaisleyCorner position="bl" className={cx(styles.ornament, styles.corner, styles.bl)} />
      <PaisleyCorner position="br" className={cx(styles.ornament, styles.corner, styles.br)} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
