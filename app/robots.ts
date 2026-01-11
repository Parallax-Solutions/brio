import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://brio.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/expenses/",
          "/income/",
          "/recurring/",
          "/subscriptions/",
          "/savings/",
          "/rates/",
          "/variables/",
          "/users/",
          "/profile/",
          "/onboarding/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
