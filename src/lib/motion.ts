/**
 * Motion tokens for JS-driven animation. Mirror of the CSS motion tokens in
 * src/styles/tokens.css — keep them in sync.
 */
export const MOTION = {
  ease: {
    out: "expo.out",
    soft: "power2.out",
    inOut: "power3.inOut",
  },
  dur: {
    fast: 0.32,
    base: 0.6,
    slow: 1.0,
    intro: 1.6,
  },
  stagger: 0.08,
  revealDistance: 36,
} as const;

/** Media queries used by the motion controller. */
export const MEDIA = {
  /** Pinning + heavy parallax only on large, fine-pointer screens. */
  desktop: "(min-width: 1024px) and (pointer: fine)",
  touchOrSmall: "(max-width: 1023.98px), (pointer: coarse)",
  reduce: "(prefers-reduced-motion: reduce)",
  motionOk: "(prefers-reduced-motion: no-preference)",
} as const;
