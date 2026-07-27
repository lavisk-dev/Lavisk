import { BRAND_NAME, SITE_URL, SITE_DESCRIPTION, SOCIALS } from "@/lib/constants";
import type { BlogPost, Product, Category } from "@/lib/types";

// ---------------------------------------------------------------------
// Structured data builders.
//
// We emit JSON-LD everywhere possible. This surfaces the site to:
//   - SEO         → Google's classic result treatments (rich cards, sitelinks)
//   - AEO         → answer engines (Perplexity, ChatGPT search, Bing Copilot)
//                   pick up FAQPage and Speakable schema for citation
//   - GEO         → generative engines index Organization/Product/Article
//                   entities and can quote them with source attribution
//
// Rules of thumb:
//   - Attach BreadcrumbList to every non-home page
//   - Attach an entity-specific schema (Product, Article, FAQPage, ItemList)
//     on the page whose primary content matches
//   - Prefer absolute URLs so answer engines can resolve them without context
// ---------------------------------------------------------------------

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: BRAND_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: absoluteUrl("/hero/gifted-closed.png"),
    sameAs: SOCIALS.map((s) => s.href),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "hello@lavisk.example",
      availableLanguage: ["English"],
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: BRAND_NAME,
    description: SITE_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(trail: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.href),
    })),
  };
}

export function productSchema(product: Product, categoryName?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": absoluteUrl(`/product/${product.slug}#product`),
    name: product.name,
    description: product.story || product.description,
    sku: product.id,
    category: categoryName ?? product.categorySlug,
    brand: { "@type": "Brand", name: BRAND_NAME },
    image: product.images.length
      ? product.images.map((img) => img.url)
      : [absoluteUrl("/hero/gifted-closed.png")],
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating.toFixed(1),
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@id": `${SITE_URL}#organization` },
    },
  };
}

export function itemListSchema(name: string, path: string, products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl(path),
    numberOfItems: products.length,
    itemListElement: products.map((product, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/product/${product.slug}`),
      name: product.name,
    })),
  };
}

export function collectionPageSchema(
  name: string,
  description: string,
  path: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: { "@id": `${SITE_URL}#website` },
  };
}

export function articleSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": absoluteUrl(`/blog/${post.slug}#article`),
    headline: post.title,
    description: post.excerpt,
    articleSection: post.category,
    keywords: post.keywords?.join(", "),
    author: {
      "@type": "Person",
      name: post.authorName,
      jobTitle: post.authorRole,
    },
    publisher: { "@id": `${SITE_URL}#organization` },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    // Speakable content signals AEO/voice engines which sections are safe
    // to read aloud verbatim (the excerpt in our case).
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".article-excerpt", "article h2"],
    },
  };
}

export function faqPageSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function blogListingSchema(posts: BlogPost[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": absoluteUrl("/blog#blog"),
    url: absoluteUrl("/blog"),
    name: `${BRAND_NAME} Journal`,
    description: "Editorial from the Lavisk team — etiquette, care, and pairing guides.",
    publisher: { "@id": `${SITE_URL}#organization` },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt,
      author: { "@type": "Person", name: post.authorName },
    })),
  };
}

export function categoryPageSchema(category: Category, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} gifts`,
    description: `Curated ${category.name.toLowerCase()} gifts from ${BRAND_NAME}.`,
    url: absoluteUrl(path),
    isPartOf: { "@id": `${SITE_URL}#website` },
  };
}

/** Emit multiple schemas in a single script tag as an @graph document. */
export function jsonLdGraph(schemas: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": schemas.filter(Boolean),
  };
}
