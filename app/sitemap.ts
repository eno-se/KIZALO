import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const creators = await db.creatorProfile.findMany({
    select: { slug: true, updatedAt: true },
  });

  const creatorEntries: MetadataRoute.Sitemap = creators.map((c) => ({
    url: `https://kizalo.com/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    {
      url: "https://kizalo.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://kizalo.com/guide",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...creatorEntries,
  ];
}
