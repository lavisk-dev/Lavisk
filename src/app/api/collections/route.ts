import { CollectionService } from "@/lib/services/collection.service";
import { ok, serverError } from "@/lib/utils/api";

export async function GET() {
  try {
    const collections = await CollectionService.list();
    return ok(collections);
  } catch (error) {
    return serverError(error);
  }
}