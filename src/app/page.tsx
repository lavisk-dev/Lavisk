import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { StatsStrip } from "@/components/home/stats-strip";
import { CategorySection } from "@/components/home/category-section";
import { TrendingMarquee } from "@/components/home/trending-marquee";
import { BestsellerSection } from "@/components/home/bestseller-section";
import { JournalSection } from "@/components/home/journal-section";
import { WhyUsSection } from "@/components/home/why-us-section";
import { ProductService } from "@/lib/services/product.service";
import { CategoryService } from "@/lib/services/category.service";
import { BlogService } from "@/lib/services/blog.service";
import { JsonLd } from "@/components/shared/json-ld";
import {
  jsonLdGraph,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo/schemas";

async function Categories() {
  const categories = await CategoryService.list();
  return <CategorySection categories={categories} />;
}

async function Trending() {
  const { products } = await ProductService.list({ trending: true, pageSize: 8 });
  return <TrendingMarquee products={products} />;
}

async function Bestsellers() {
  const { products } = await ProductService.list({ sort: "rating", pageSize: 6 });
  return <BestsellerSection products={products} />;
}

async function Journal() {
  const posts = await BlogService.listPublished(3);
  return <JournalSection posts={posts} />;
}

function SectionSkeleton() {
  return (
    <div className="mt-14 md:mt-16">
      <div className="mb-5 h-8 w-48 animate-pulse rounded-full bg-brand-mist/60" />
      <div className="grid grid-cols-2 gap-5 md:gap-[22px] lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[280px] animate-pulse rounded-[26px] bg-brand-mist/40" />
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  // Home page emits Organization + WebSite (with SearchAction) as an
  // @graph so Google, Bing, Perplexity and generative engines can all
  // resolve the site's core entity from a single JSON-LD block.
  const graph = jsonLdGraph([organizationSchema(), websiteSchema()]);

  return (
    <>
      <JsonLd data={graph} />
      <Hero />
      <div className="mx-auto max-w-[1320px] px-5 md:px-10">
      <StatsStrip />
      <Suspense fallback={<SectionSkeleton />}>
        <Categories />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Trending />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Bestsellers />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Journal />
      </Suspense>
      <WhyUsSection />
      </div>
    </>
  );
}
