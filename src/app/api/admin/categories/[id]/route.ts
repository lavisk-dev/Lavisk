import type { NextRequest } from "next/server";
import { z } from "zod";
import { CategoryService } from "@/lib/services/category.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  count: z.number().int().min(0),
  gradientFrom: z.string(),
  gradientTo: z.string(),
  blobColor: z.string(),
  imageUrl: z.string().nullable().optional(),
  imagePublicId: z.string().nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const { id } = await params;
    const parsed = categorySchema.partial().safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid category", 422);
    }
    const category = await CategoryService.update(id, parsed.data);
    return ok(category);
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
    await CategoryService.remove(id);
    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
