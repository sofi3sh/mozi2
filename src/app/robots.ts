import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export default function robots(): MetadataRoute.Robots {
  const sitemap = SITE_URL ? `${SITE_URL.replace(/\/$/, "")}/sitemap.xml` : "/sitemap.xml";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/login",
        "/auth",
        "/api",
        "/cart",
        "/checkout",
        "/ua/cart",
        "/ru/cart",
        "/ua/checkout",
        "/ru/checkout",
      ],
    },
    sitemap,
  };
}
