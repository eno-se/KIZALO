import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/edit", "/admin", "/settings", "/setup", "/suspended"],
    },
    sitemap: "https://kizalo.com/sitemap.xml",
  };
}
