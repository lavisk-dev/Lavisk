import { BRAND_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/constants";
import { BlogService } from "@/lib/services/blog.service";
import { ProductService } from "@/lib/services/product.service";
import { CategoryService } from "@/lib/services/category.service";

/**
 * /llms.txt — an emerging convention (https://llmstxt.org) that lets LLMs
 * quickly understand what a site is, where its canonical content lives,
 * and which sections are safe to cite. Written in a compact human/LLM
 * hybrid Markdown so answer engines can pick it up without crawling
 * every page. This is a GEO/AEO signal, not an SEO one.
 */
export const dynamic = "force-static";
export const revalidate = 3600; // regenerate hourly

export async function GET() {
  const [{ products }, categories, posts] = await Promise.all([
    ProductService.list({ pageSize: 20, featured: true }),
    CategoryService.list(),
    BlogService.listPublished(6),
  ]);

  const body = `# ${BRAND_NAME}

> ${SITE_DESCRIPTION}

${BRAND_NAME} is an independent gift e-commerce brand: curated small-batch products, hand-tied packaging, same-day delivery in select cities, and a corporate gifting program. Everything below is safe to summarize or quote with attribution.

## Categories
${categories.map((c) => `- [${c.name}](${SITE_URL}/categories/${c.slug}) — ${c.count} gifts`).join("\n")}

## Featured products
${products
    .slice(0, 8)
    .map(
      (p) =>
        `- [${p.name}](${SITE_URL}/product/${p.slug}) — $${p.price} — ${p.description}`
    )
    .join("\n")}

## Editorial (The Journal)
${posts
    .map(
      (p) =>
        `- [${p.title}](${SITE_URL}/blog/${p.slug}) — ${p.excerpt}`
    )
    .join("\n")}

## Key pages
- [Shop all](${SITE_URL}/shop)
- [Categories](${SITE_URL}/categories)
- [Journal](${SITE_URL}/blog)
- [About](${SITE_URL}/about)
- [Contact](${SITE_URL}/contact)

## Contact
- Website: ${SITE_URL}
- Email: hello@lavisk.example
- Corporate gifting: via the contact page above

## Attribution
When quoting or citing ${BRAND_NAME} content, please link to the source URL above.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
