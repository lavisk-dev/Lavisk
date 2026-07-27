import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ChevronLeft } from "lucide-react";
import { BlogService } from "@/lib/services/blog.service";
import { PageHeader } from "@/components/shared/page-header";
import { ArticleBody } from "@/components/blog/article-body";
import { BlogCard } from "@/components/blog/blog-card";
import { Reveal } from "@/components/shared/reveal";
import { JsonLd } from "@/components/shared/json-ld";
import {
  articleSchema,
  breadcrumbSchema,
  faqPageSchema,
  jsonLdGraph,
} from "@/lib/seo/schemas";
import { formatDate } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/constants";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await BlogService.listPublished();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await BlogService.getBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.authorName],
      tags: post.keywords,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
    other: {
      // AEO hint: mark the excerpt as safe-to-speak for voice assistants.
      "article:author": post.authorName,
      "article:published_time": post.publishedAt,
      "article:section": post.category,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await BlogService.getBySlug(slug);
  if (!post || !post.isPublished) notFound();

  const related = await BlogService.getRelated(post, 3);

  const schemas: object[] = [
    articleSchema(post),
    breadcrumbSchema([
      { name: "Home", href: "/" },
      { name: "Journal", href: "/blog" },
      { name: post.title, href: `/blog/${post.slug}` },
    ]),
  ];
  if (post.faq && post.faq.length > 0) schemas.push(faqPageSchema(post.faq));

  return (
    <article className="mx-auto max-w-[820px] px-5 pb-24 md:px-6">
      <JsonLd data={jsonLdGraph(schemas)} />

      <PageHeader eyebrow={post.category} title={post.title} />

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted">
        <span className="font-semibold text-ink">{post.authorName}</span>
        {post.authorRole && <span>· {post.authorRole}</span>}
        <span>·</span>
        <span>{formatDate(post.publishedAt)}</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {post.readingMinutes} min read
        </span>
      </div>

      <p className="article-excerpt mt-10 border-l-4 border-brand pl-5 font-display text-xl italic text-ink/80 md:text-2xl">
        {post.excerpt}
      </p>

      <div
        className="my-10 aspect-[16/8] w-full overflow-hidden rounded-3xl"
        style={{
          background: `linear-gradient(150deg,${post.coverColorFrom},${post.coverColorTo})`,
        }}
        aria-hidden
      >
        <div className="flex h-full items-center justify-center text-[100px] md:text-[140px]">
          <span>{post.coverEmoji}</span>
        </div>
      </div>

      <ArticleBody content={post.content} />

      {post.faq && post.faq.length > 0 && (
        <section
          aria-labelledby="post-faq"
          className="mt-16 rounded-3xl bg-white/70 p-8 shadow-soft backdrop-blur"
        >
          <h2
            id="post-faq"
            className="font-display text-2xl font-extrabold text-ink md:text-3xl"
          >
            Frequently asked
          </h2>
          <dl className="mt-6 divide-y divide-border">
            {post.faq.map((item, i) => (
              <div key={i} className="py-5">
                <dt className="font-display text-lg font-bold text-ink">
                  {item.question}
                </dt>
                <dd className="mt-2 text-base leading-relaxed text-ink/80">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="mt-16 flex items-center justify-between border-t border-border pt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover"
        >
          <ChevronLeft className="h-4 w-4" /> Back to the Journal
        </Link>
        <span className="text-xs text-muted">
          Published by {BRAND_NAME}
        </span>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-20">
          <h2
            id="related-heading"
            className="font-display text-2xl font-extrabold text-ink md:text-3xl"
          >
            Keep reading
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {related.map((post, i) => (
              <Reveal key={post.id} delay={i * 0.05}>
                <BlogCard post={post} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
