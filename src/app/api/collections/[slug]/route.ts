import { CollectionService } from "@/lib/services/collection.service";
import { ProductService } from "@/lib/services/product.service";
import { ok, serverError } from "@/lib/utils/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const collection = await CollectionService.getBySlug(slug);
    if (!collection) {
      return Response.json({ success: false, error: "Collection not found" }, { status: 404 });
    }
    const products = await ProductService.list({ collection: slug, pageSize: 100 });
    return ok({ collection, products });
  } catch (error) {
    return serverError(error);
  }
}