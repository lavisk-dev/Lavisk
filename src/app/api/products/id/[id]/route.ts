import { ProductService } from "@/lib/services/product.service";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await ProductService.getById(id);
    if (!product) return fail("Product not found", 404);
    return ok(product);
  } catch (error) {
    return serverError(error);
  }
}
