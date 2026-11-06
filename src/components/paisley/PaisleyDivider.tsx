import { DIVIDER } from "./motifs";

export interface PaisleyDividerProps {
  className?: string;
}

/**
 * Centered ornament: thin rule — floret — thin rule. Fills its container's
 * width; colour follows currentColor. Decorative (aria-hidden).
 */
export function PaisleyDivider({ className }: PaisleyDividerProps) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{ display: "flex", alignItems: "center", gap: "0.75em", width: "100%" }}
    >
      <span style={{ flex: 1, height: 0, borderTop: "1px solid currentColor", opacity: 0.7 }} />
      <svg
        viewBox="0 0 48 24"
        width="3em"
        height="1.5em"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        style={{ flex: "none", overflow: "visible" }}
      >
        <g data-drift="">
          <path d={DIVIDER.floret} strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
        </g>
        <path d={DIVIDER.solid} fill="currentColor" stroke="none" />
      </svg>
      <span style={{ flex: 1, height: 0, borderTop: "1px solid currentColor", opacity: 0.7 }} />
    </div>
  );
}
