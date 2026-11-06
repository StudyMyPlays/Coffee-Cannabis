import { GLYPH } from "./motifs";

export interface PaisleyGlyphProps {
  className?: string;
  /** Accessible name. When omitted the glyph is decorative (aria-hidden). */
  title?: string;
}

/**
 * A single paisley teardrop (boteh) with inner linework, eye and dotted halo.
 * Size it with CSS (width or height); colour follows `currentColor`.
 */
export function PaisleyGlyph({ className, title }: PaisleyGlyphProps) {
  const a11y = title ? { role: "img" as const } : { "aria-hidden": true as const, focusable: "false" as const };
  return (
    <svg
      viewBox="0 0 62 92"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...a11y}
    >
      {title ? <title>{title}</title> : null}
      <path d={GLYPH.outline} strokeWidth={1.3} vectorEffect="non-scaling-stroke" />
      <path d={GLYPH.fine} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
      <path d={GLYPH.solid} fill="currentColor" stroke="none" />
      <path d={GLYPH.halo} fill="currentColor" stroke="none" data-drift="" />
    </svg>
  );
}
