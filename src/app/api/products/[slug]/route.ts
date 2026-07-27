import { ProductService } from "@/lib/services/product.service";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await ProductService.getBySlug(slug);
    if (!product) return fail("Product not found", 404);
    return ok(product);
  } catch (error) {
    return serverError(error);
  }
}
