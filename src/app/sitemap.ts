import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getDataAdapter } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const adapter = getDataAdapter();
  const [gatherings, drinks] = await Promise.all([adapter.listGatherings(), adapter.listDrinks()]);
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/join`, lastModified: now, priority: 0.9 },
    { url: `${SITE_URL}/gatherings`, lastModified: now },
    ...gatherings.filter((g) => g.status !== "draft").map((g) => ({ url: `${SITE_URL}/gatherings/${g.slug}`, lastModified: new Date(g.updatedAt) })),
    ...drinks.filter((d) => d.active && !d.secret).map((d) => ({ url: `${SITE_URL}/drinks/${d.slug}`, lastModified: now })),
    { url: `${SITE_URL}/privacy` },
    { url: `${SITE_URL}/terms` },
  ];
}
