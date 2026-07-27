import Link from "next/link";
import { Plus } from "lucide-react";
import { ProductService } from "@/lib/services/product.service";
import { Button } from "@/components/ui/button";
import { AdminProductsTable } from "@/components/admin/products/admin-products-table";

export default async function AdminProductsPage() {
  const { products } = await ProductService.list({ pageSize: 200 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{products.length} products</p>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        </Button>
      </div>

      <AdminProductsTable initialProducts={products} />
    </div>
  );
}
