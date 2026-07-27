import type { NextRequest } from "next/server";
import { ProductService } from "@/lib/services/product.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { productSchema } from "@/lib/utils/validation";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const { id } = await params;
    const parsed = productSchema.partial().safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid product", 422);
    }
    const product = await ProductService.update(id, parsed.data);
    return ok(product);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const { id } = await params;
    await ProductService.remove(id);
    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
