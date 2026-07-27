import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductService } from "@/lib/services/product.service";
import { ProductDetailWrapper } from "@/components/products/product-detail-wrapper";
import { ProductDetailSkeleton } from "@/components/products/product-detail-skeleton";
import { formatCurrency } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/constants";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await ProductService.getBySlug(slug);
  if (!product) return { title: "Gift not found" };

  return {
    title: product.name,
    description: `${product.description} — ${formatCurrency(product.price)}. ${product.story}`,
    keywords: [product.name, product.categorySlug, "gift", "gift delivery", BRAND_NAME.toLowerCase()],
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} · ${BRAND_NAME}`,
      description: product.description,
      url: `/product/${product.slug}`,
      images: product.images[0]?.url ? [{ url: product.images[0].url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} · ${BRAND_NAME}`,
      description: product.description,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-16 pt-28 md:px-8 md:pt-32">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailWrapper slug={slug} />
      </Suspense>
    </div>
  );
}
