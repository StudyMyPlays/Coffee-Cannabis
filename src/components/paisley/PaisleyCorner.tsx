import { CORNER } from "./motifs";

export type PaisleyCornerPosition = "tl" | "tr" | "bl" | "br";

export interface PaisleyCornerProps {
  className?: string;
  /** Which corner the flourish anchors to; the artwork is mirrored to match. */
  position: PaisleyCornerPosition;
}

const MIRROR: Record<PaisleyCornerPosition, string | undefined> = {
  tl: undefined,
  tr: "translate(160 0) scale(-1 1)",
  bl: "translate(0 160) scale(1 -1)",
  br: "translate(160 160) scale(-1 -1)",
};

/** Reflection across the diagonal: turns the top-edge vine into the left-edge vine. */
const DIAGONAL = "matrix(0 1 1 0 0 0)";

function EdgeVine({ transform }: { transform?: string }) {
  return (
    <g transform={transform}>
      <path d={CORNER.rules} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <g data-drift="">
        <path d={CORNER.vine} strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
        <path d={CORNER.leaves} fill="currentColor" stroke="none" />
      </g>
      <path d={CORNER.floret} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
      <path d={CORNER.floretSolid} fill="currentColor" stroke="none" />
    </g>
  );
}

/**
 * Ornate corner flourish: a diagonal paisley with a dotted halo, flanked by
 * scrolling vines, leaves and florets that run out along both edges and hand
 * off to a thin double rule. 160×160 artwork anchored to the corner; size via CSS.
 */
export function PaisleyCorner({ className, position }: PaisleyCornerProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={className}
      data-position={position}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform={MIRROR[position]}>
        <EdgeVine />
        <EdgeVine transform={DIAGONAL} />
        <path d={CORNER.paisleyOutline} strokeWidth={1.3} vectorEffect="non-scaling-stroke" />
        <path d={CORNER.paisleyFine} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
        <path d={CORNER.paisleySolid} fill="currentColor" stroke="none" />
        <path d={CORNER.halo} fill="currentColor" stroke="none" data-drift="" />
      </g>
    </svg>
  );
}
