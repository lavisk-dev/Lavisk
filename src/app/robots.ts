import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

// Robots directives. We allow all major crawlers, including AI training
// bots (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) so the
// storefront's editorial and product content is eligible to appear as
// cited answers. Disallow only checkout/cart/admin, which are private.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/checkout", "/cart", "/order-success", "/wishlist"],
      },
      // Common AI crawlers — explicitly opted in to public content
      { userAgent: "GPTBot", allow: "/", disallow: ["/admin", "/api", "/checkout"] },
      { userAgent: "ClaudeBot", allow: "/", disallow: ["/admin", "/api", "/checkout"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/admin", "/api", "/checkout"] },
      { userAgent: "Google-Extended", allow: "/", disallow: ["/admin", "/api", "/checkout"] },
      { userAgent: "CCBot", allow: "/", disallow: ["/admin", "/api", "/checkout"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
