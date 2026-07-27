import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryService } from "@/lib/services/category.service";
import { ProductService } from "@/lib/services/product.service";
import { ProductGrid } from "@/components/products/product-grid";
import { PageHeader } from "@/components/shared/page-header";
import { JsonLd } from "@/components/shared/json-ld";
import {
  categoryPageSchema,
  itemListSchema,
  breadcrumbSchema,
  jsonLdGraph,
} from "@/lib/seo/schemas";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await CategoryService.getBySlug(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: `${category.name} gifts`,
    description: `Shop ${category.count} thoughtfully wrapped ${category.name.toLowerCase()} gifts — hand-tied, ribboned, and delivered with care.`,
    keywords: [category.name.toLowerCase(), `${category.name.toLowerCase()} gifts`, "gift ideas", "gift delivery"],
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: {
      type: "website",
      title: `${category.name} gifts · Lavisk`,
      description: `Shop ${category.count} thoughtfully wrapped ${category.name.toLowerCase()} gifts.`,
      url: `/categories/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await CategoryService.getBySlug(slug);
  if (!category) notFound();

  const { products, total } = await ProductService.list({ category: slug, pageSize: 48 });

  const graph = jsonLdGraph([
    categoryPageSchema(category, `/categories/${category.slug}`),
    itemListSchema(`${category.name} gifts`, `/categories/${category.slug}`, products),
    breadcrumbSchema([
      { name: "Home", href: "/" },
      { name: "Categories", href: "/categories" },
      { name: category.name, href: `/categories/${category.slug}` },
    ]),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-16 md:px-8">
      <JsonLd data={graph} />
      <PageHeader
        eyebrow="Occasion"
        title={`${category.name} gifts`}
        subtitle={`${total} ${total === 1 ? "gift" : "gifts"} picked for the occasion.`}
      />
      <div className="mt-10">
        <ProductGrid products={products} quickView columns={3} />
      </div>
    </div>
  );
}
