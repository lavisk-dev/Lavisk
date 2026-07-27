import { CategoryService } from "@/lib/services/category.service";
import { ok, serverError } from "@/lib/utils/api";

export async function GET() {
  try {
    const categories = await CategoryService.list();
    return ok(categories);
  } catch (error) {
    return serverError(error);
  }
}
