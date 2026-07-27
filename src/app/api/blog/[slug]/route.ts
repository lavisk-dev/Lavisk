import type { NextRequest } from "next/server";
import { BlogService } from "@/lib/services/blog.service";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await BlogService.getBySlug(slug);
    if (!post || !post.isPublished) return fail("Not found", 404);
    return ok(post);
  } catch (error) {
    return serverError(error);
  }
}
