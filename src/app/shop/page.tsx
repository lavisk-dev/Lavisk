import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductService, type ProductFilters } from "@/lib/services/product.service";
import { CategoryService } from "@/lib/services/category.service";
import { ShopFilters } from "@/components/products/shop-filters";
import { ShopProducts } from "@/components/products/shop-products";
import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { JsonLd } from "@/components/shared/json-ld";
import {
  breadcrumbSchema,
  collectionPageSchema,
  jsonLdGraph,
} from "@/lib/seo/schemas";

export const metadata: Metadata = {
  title: "Shop all gifts",
  description:
    "Browse the full Lavisk collection — flowers, chocolate, personalized keepsakes, and more, with free hand-wrapping on every order.",
  keywords: ["gift shop", "gift ideas", "flowers", "chocolate", "personalized gifts", "online gifts"],
  alternates: { canonical: "/shop" },
  openGraph: {
    type: "website",
    title: "Shop all gifts · Lavisk",
    description: "The full Lavisk collection — flowers, chocolate, personalized keepsakes.",
    url: "/shop",
  },
};

interface ShopPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const sp = await searchParams;

  const filters: ProductFilters = {
    category: sp.category,
    search: sp.search,
    trending: sp.filter === "trending" || undefined,
    sort: (sp.sort as ProductFilters["sort"]) ?? "newest",
    pageSize: 48,
  };

  const categories = await CategoryService.list();

  const graph = jsonLdGraph([
    collectionPageSchema(
      "Shop all gifts",
      "The full Lavisk collection — flowers, chocolate, personalized keepsakes.",
      "/shop"
    ),
    breadcrumbSchema([
      { name: "Home", href: "/" },
      { name: "Shop", href: "/shop" },
    ]),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-16 md:px-8">
      <JsonLd data={graph} />
      <PageHeader
        eyebrow="The collection"
        title="Every gift, wrapped to wow"
        subtitle="Hand-picked, ribboned and ready. Filter by occasion or sort to find the one."
      />

      <div className="mt-10">
        <ShopFilters categories={categories} />
        <Suspense fallback={<ProductGridSkeleton columns={3} />}>
          <ShopProducts filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}
