import { notFound } from "next/navigation";
import { ProductService } from "@/lib/services/product.service";
import { CategoryService } from "@/lib/services/category.service";
import { ProductDetail } from "@/components/products/product-detail";
import { ProductReviews } from "@/components/products/product-reviews";
import { ProductGrid } from "@/components/products/product-grid";
import { Reveal } from "@/components/shared/reveal";
import { JsonLd } from "@/components/shared/json-ld";
import { productSchema, breadcrumbSchema, jsonLdGraph } from "@/lib/seo/schemas";

export async function ProductDetailWrapper({ slug }: { slug: string }) {
  const product = await ProductService.getBySlug(slug);
  if (!product) notFound();

  const [related, category] = await Promise.all([
    ProductService.getRelated(product, 3),
    CategoryService.getBySlug(product.categorySlug),
  ]);

  const graph = jsonLdGraph([
    productSchema(product, category?.name),
    breadcrumbSchema([
      { name: "Home", href: "/" },
      { name: "Shop", href: "/shop" },
      ...(category
        ? [{ name: category.name, href: `/categories/${category.slug}` }]
        : []),
      { name: product.name, href: `/product/${product.slug}` },
    ]),
  ]);

  return (
    <>
      <JsonLd data={graph} />
      <ProductDetail product={product} />
      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <section className="mt-16">
          <Reveal>
            <h2 className="mb-6 font-display text-3xl font-bold tracking-[-0.02em]">
              You might also love
            </h2>
          </Reveal>
          <ProductGrid products={related} quickView columns={3} />
        </section>
      )}
    </>
  );
}
