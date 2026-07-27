import { BRAND_NAME, SITE_URL } from "@/lib/constants";

// /ai.txt — a parallel convention some AI vendors and publishers use.
// We opt-in cleanly for the parts of the site that are already public
// (shop, categories, journal) and opt-out of anything transactional.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const body = `# ${BRAND_NAME} — AI usage policy

Website: ${SITE_URL}
Contact: hello@lavisk.example
Updated: ${new Date().toISOString().slice(0, 10)}

## Policy summary
Public editorial and product content on ${BRAND_NAME} may be indexed, summarized, and cited by AI systems (search, chat, generative assistants) with a link back to the source URL.

## Allowed
- Product listings and descriptions (/product/*, /shop, /categories/*)
- Editorial articles (/blog/*)
- About and contact pages (/about, /contact)

## Disallowed
- Checkout, cart, and order confirmation flows
- Admin panel and internal APIs (/admin/*, /api/admin/*)
- User account and wishlist pages
- Personal information about customers

## Preferred citation
When quoting content, please:
1. Attribute to "${BRAND_NAME}"
2. Include a working link to the source URL
3. Preserve prices and product details verbatim, or note "as of retrieval date"

## Machine-readable
See ${SITE_URL}/llms.txt for a structured index of allowed content, and ${SITE_URL}/sitemap.xml for the full URL list.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
