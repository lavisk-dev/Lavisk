import type { NextRequest } from "next/server";
import { ProductService } from "@/lib/services/product.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { productSchema } from "@/lib/utils/validation";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const sp = req.nextUrl.searchParams;
    const result = await ProductService.list({
      search: sp.get("search") ?? undefined,
      category: sp.get("category") ?? undefined,
      pageSize: 100,
    });
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const parsed = productSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid product", 422);
    }
    const product = await ProductService.create(parsed.data);
    return ok(product, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
