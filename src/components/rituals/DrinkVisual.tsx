import Image from "next/image";
import { BrandImage, ImagePlaceholder } from "@/components/ui/BrandImage";
import { IMAGE_NAMES, type ImageName } from "@/lib/images";
import type { Drink } from "@/lib/data/types";

const isImageName = (v: string): v is ImageName => (IMAGE_NAMES as readonly string[]).includes(v);

/** Drink photography: manifest asset, CMS-supplied path/URL, or labeled placeholder. */
export function DrinkVisual({ drink, sizes, priority }: { drink: Drink; sizes: string; priority?: boolean }) {
  const alt = drink.imageAlt || `${drink.name}, ${drink.profile}`;
  if (drink.image && isImageName(drink.image)) {
    return <BrandImage name={drink.image} alt={alt} sizes={sizes} priority={priority} tint={drink.accent} />;
  }
  if (drink.image && /^(https:\/\/|\/)/.test(drink.image)) {
    return <Image src={drink.image} alt={alt} fill sizes={sizes} style={{ objectFit: "cover" }} />;
  }
  return <ImagePlaceholder label={`drink-${drink.slug}.jpg`} alt={alt} tint={drink.accent} />;
}
