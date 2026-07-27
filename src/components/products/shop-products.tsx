import { ProductService, type ProductFilters } from "@/lib/services/product.service";
import { ProductGrid } from "@/components/products/product-grid";

interface ShopProductsProps {
  filters: ProductFilters;
}

export async function ShopProducts({ filters }: ShopProductsProps) {
  const { products, total } = await ProductService.list(filters);

  return (
    <>
      <div className="mb-5 text-sm text-muted">
        {total} {total === 1 ? "gift" : "gifts"}
      </div>
      <ProductGrid products={products} quickView columns={3} />
    </>
  );
}
