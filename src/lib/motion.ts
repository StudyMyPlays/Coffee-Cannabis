/**
 * Motion tokens for JS-driven animation. Mirror of the CSS motion tokens in
 * src/styles/tokens.css — keep them in sync.
 */

/** Cubic-bézier control points, identical to the CSS custom properties. */
export const CURVES = {
  /** --ease-out: enter / exit. */
  out: "0.23,1,0.32,1",
  /** --ease-in-out: on-screen movement. */
  inOut: "0.77,0,0.175,1",
} as const;

export const MOTION = {
  /** Names registered with GSAP's CustomEase from CURVES (see MotionController). */
  ease: {
    out: "cc-out",
    inOut: "cc-in-out",
  },
  /** Seconds; mirrors --dur-press, --dur-2, --dur-3, --dur-4, --dur-5. */
  dur: {
    press: 0.14,
    fast: 0.24,
    base: 0.6,
    slow: 1.0,
    intro: 1.6,
  },
  /** Mirrors --stagger. */
  stagger: 0.08,
  /** Longest cascade in one reveal batch, in steps (6 × 80ms). */
  staggerMax: 6,
  /** Mirrors --reveal-distance (px). */
  revealDistance: 24,
} as const;

/** Media queries used by the motion controller. */
export const MEDIA = {
  /** Pinning + heavy parallax only on large, fine-pointer screens. */
  desktop: "(min-width: 1024px) and (pointer: fine)",
  touchOrSmall: "(max-width: 1023.98px), (pointer: coarse)",
  reduce: "(prefers-reduced-motion: reduce)",
  motionOk: "(prefers-reduced-motion: no-preference)",
} as const;
