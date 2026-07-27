import type { Metadata } from "next";
import { BlogService } from "@/lib/services/blog.service";
import { BlogCard } from "@/components/blog/blog-card";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/reveal";
import { JsonLd } from "@/components/shared/json-ld";
import {
  blogListingSchema,
  breadcrumbSchema,
  jsonLdGraph,
  collectionPageSchema,
} from "@/lib/seo/schemas";
import { BRAND_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Journal — thoughtful gift-giving, decoded",
  description: `Field notes from the ${BRAND_NAME} team on gift etiquette, flower care, chocolate pairing, corporate gifting and more.`,
  keywords: [
    "gift ideas blog",
    "gift etiquette",
    "flower care",
    "chocolate pairing",
    "gifting guide",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "The Lavisk Journal",
    description: "Editorial on thoughtful gift-giving from the Lavisk team.",
    url: "/blog",
  },
};

export default async function BlogIndexPage() {
  const posts = await BlogService.listPublished();

  const graph = jsonLdGraph([
    collectionPageSchema(
      "The Lavisk Journal",
      "Editorial on thoughtful gift-giving.",
      "/blog"
    ),
    blogListingSchema(posts),
    breadcrumbSchema([
      { name: "Home", href: "/" },
      { name: "Journal", href: "/blog" },
    ]),
  ]);

  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-24 md:px-8">
      <JsonLd data={graph} />
      <PageHeader
        eyebrow="The Journal"
        title="Field notes on giving well."
        subtitle="Etiquette, care, and pairing guides from the Lavisk team — short, useful, and written by people who send gifts for a living."
      />

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <Reveal key={post.id} delay={i * 0.05}>
            <BlogCard post={post} />
          </Reveal>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="mt-16 text-center text-muted">
          The Journal is empty right now — check back soon.
        </p>
      )}
    </div>
  );
}
