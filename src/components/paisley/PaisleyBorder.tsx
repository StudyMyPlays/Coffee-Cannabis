import { useId } from "react";
import { BORDER_LINE, BORDER_RICH } from "./motifs";

export interface PaisleyBorderProps {
  className?: string;
  /** "line": double rule, dots and diamonds. "rich": paisleys facing a central floret. */
  variant?: "line" | "rich";
}

/** Wide enough that the tile never runs out: 80 tiles ≈ 3840px at a 24px strip height. */
const SPAN = 240 * 80;

/**
 * Horizontal ornamental strip that tiles a 240×48 paisley motif.
 * Height comes from CSS (default 24px); the motif scales with the height and
 * repeats across the full width. Decorative — always aria-hidden.
 */
export function PaisleyBorder({ className, variant = "rich" }: PaisleyBorderProps) {
  const id = `paisley-border-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const rich = variant === "rich";
  return (
    <svg
      className={className}
      width="100%"
      height="24"
      viewBox={`0 0 ${SPAN} 48`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      data-variant={variant}
    >
      <defs>
        <pattern id={id} width="240" height="48" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            {rich ? (
              <>
                <path d={BORDER_RICH.rules} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
                <path d={BORDER_RICH.outline} strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
                <path d={BORDER_RICH.fine} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
                <path d={BORDER_RICH.solid} fill="currentColor" stroke="none" />
                <path d={BORDER_RICH.dots} fill="currentColor" stroke="none" data-drift="" />
              </>
            ) : (
              <>
                <path d={BORDER_LINE.rules} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
                <path d={BORDER_LINE.solid} fill="currentColor" stroke="none" />
                <path d={BORDER_LINE.dots} fill="currentColor" stroke="none" data-drift="" />
              </>
            )}
          </g>
        </pattern>
      </defs>
      <rect width={SPAN} height="48" fill={`url(#${id})`} />
    </svg>
  );
}
