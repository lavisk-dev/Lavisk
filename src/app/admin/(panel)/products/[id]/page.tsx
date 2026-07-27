import { notFound } from "next/navigation";
import { ProductService } from "@/lib/services/product.service";
import { ProductForm } from "@/components/admin/products/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await ProductService.getById(id);
  if (!product) notFound();

  return (
    <div className="max-w-5xl">
      <ProductForm product={product} />
    </div>
  );
}
