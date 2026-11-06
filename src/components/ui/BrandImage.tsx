import Image from "next/image";
import { getImage, type ImageName } from "@/lib/images";
import styles from "./BrandImage.module.css";

interface Props {
  name: ImageName;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Fill the parent (parent must be positioned). Default true. */
  fill?: boolean;
  quality?: 70 | 80 | 90;
  /** Accent tint for the placeholder when the asset is missing. */
  tint?: string;
}

/**
 * Renders a manifest image through next/image (AVIF/WebP + srcset), or — when
 * the asset hasn't been supplied yet — a clearly labeled, on-brand placeholder.
 */
export function BrandImage({ name, alt, sizes, priority, className = "", fill = true, quality = 80, tint }: Props) {
  const img = getImage(name);
  if (!img) return <ImagePlaceholder label={`${name}.jpg`} alt={alt} tint={tint} className={className} />;
  return fill ? (
    <Image
      src={img.src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={quality}
      placeholder="blur"
      blurDataURL={img.blurDataURL}
      className={`${styles.img} ${className}`}
    />
  ) : (
    <Image
      src={img.src}
      alt={alt}
      width={img.width}
      height={img.height}
      sizes={sizes}
      priority={priority}
      quality={quality}
      placeholder="blur"
      blurDataURL={img.blurDataURL}
      className={className}
    />
  );
}

/** Clearly labeled, on-brand stand-in for photography that hasn't been supplied. */
export function ImagePlaceholder({ label, alt, tint, className = "" }: { label: string; alt: string; tint?: string; className?: string }) {
  return (
    <div
      className={`${styles.placeholder} ${className}`}
      style={tint ? ({ "--tint": tint } as React.CSSProperties) : undefined}
      role={alt ? "img" : undefined}
      aria-label={alt ? `${alt} (photo coming soon)` : undefined}
      aria-hidden={alt ? undefined : true}
    >
      <span className={styles.label} aria-hidden="true">
        Photo pending · {label}
      </span>
    </div>
  );
}
