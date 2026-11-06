/**
 * Typed access to the optimised brand imagery.
 *
 * The data lives in `image-manifest.generated.ts` (written by
 * `npm run images`); this module is hand-written and stable so callers never
 * import the generated file directly.
 */
import { IMAGE_MANIFEST, MISSING_IMAGES } from "./image-manifest.generated";

/** Every image name the site may reference, whether or not a source exists yet. */
export const IMAGE_NAMES = [
  "hero-field",
  "texture-parchment",
  "texture-green-grain",
  "drink-green-goddess",
  "drink-purp",
  "drink-gold-drip",
  "drink-pink-velvet",
  "drink-green-mile",
  "community-table",
  "community-dj",
  "community-arrival",
  "community-hands",
  "event-backdrop",
  "member-card",
  "og-share",
  "paisley-border",
] as const;

export type ImageName = (typeof IMAGE_NAMES)[number];

export interface BrandImage {
  /** Public path to the optimised JPG; Next/Image derives AVIF/WebP + srcset. */
  src: string;
  width: number;
  height: number;
  /** Tiny WebP data URL for `placeholder="blur"`. */
  blurDataURL: string;
}

const manifest: Partial<Record<ImageName, BrandImage>> = IMAGE_MANIFEST;
const missing: ReadonlySet<string> = new Set<string>(MISSING_IMAGES);

/** Returns the optimised image for `name`, or `null` when no source has been supplied yet. */
export function getImage(name: ImageName): BrandImage | null {
  return manifest[name] ?? null;
}

/** True when `name` has no source image — render a designed fallback instead. */
export function isMissing(name: ImageName): boolean {
  return missing.has(name) || !manifest[name];
}
