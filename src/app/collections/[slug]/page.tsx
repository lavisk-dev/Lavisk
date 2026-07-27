import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionService } from "@/lib/services/collection.service";
import { ProductService } from "@/lib/services/product.service";
import { ProductGrid } from "@/components/products/product-grid";
import { PageHeader } from "@/components/shared/page-header";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbSchema, jsonLdGraph } from "@/lib/seo/schemas";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await CollectionService.getBySlug(slug);
  if (!collection) return { title: "Collection not found" };
  return {
    title: collection.seoTitle ?? collection.name,
    description: collection.seoDescription ?? collection.description,
    alternates: { canonical: `/collections/${collection.slug}` },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await CollectionService.getBySlug(slug);
  if (!collection) notFound();

  const { products, total } = await ProductService.list({ collection: slug, pageSize: 100 });

  const graph = jsonLdGraph([
    breadcrumbSchema([
      { name: "Home", href: "/" },
      { name: "Collections", href: "/collections" },
      { name: collection.name, href: `/collections/${collection.slug}` },
    ]),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-16 md:px-8">
      <JsonLd data={graph} />
      <PageHeader
        eyebrow="Collection"
        title={collection.name}
        subtitle={collection.description}
      />
      <div className="mt-10">
        <ProductGrid products={products} quickView columns={3} />
      </div>
    </div>
  );
}