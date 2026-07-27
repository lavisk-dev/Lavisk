import { BlogService } from "@/lib/services/blog.service";
import { ok, serverError } from "@/lib/utils/api";

export async function GET() {
  try {
    const posts = await BlogService.listPublished();
    return ok(posts);
  } catch (error) {
    return serverError(error);
  }
}
