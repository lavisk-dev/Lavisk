import type { NextRequest } from "next/server";
import { z } from "zod";
import { CategoryService } from "@/lib/services/category.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  count: z.number().int().min(0).default(0),
  gradientFrom: z.string().default("#FFE9EF"),
  gradientTo: z.string().default("#FFDCE6"),
  blobColor: z.string().default("#FFB6C9"),
  imageUrl: z.string().nullable().optional(),
  imagePublicId: z.string().nullable().optional(),
});

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const categories = await CategoryService.list();
    return ok(categories);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const parsed = categorySchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid category", 422);
    }
    const category = await CategoryService.create(parsed.data);
    return ok(category, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
