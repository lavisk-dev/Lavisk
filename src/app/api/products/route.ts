import type { NextRequest } from "next/server";
import { ProductService, type ProductFilters } from "@/lib/services/product.service";
import { ok, serverError } from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const filters: ProductFilters = {
      category: sp.get("category") ?? undefined,
      search: sp.get("search") ?? undefined,
      featured: sp.get("featured") === "true" || undefined,
      trending: sp.get("trending") === "true" || undefined,
      minPrice: sp.has("minPrice") ? Number(sp.get("minPrice")) : undefined,
      maxPrice: sp.has("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
      sort: (sp.get("sort") as ProductFilters["sort"]) ?? undefined,
      page: sp.has("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.has("pageSize") ? Number(sp.get("pageSize")) : undefined,
    };

    const result = await ProductService.list(filters);
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}
