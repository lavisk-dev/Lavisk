import type { NextRequest } from "next/server";
import { z } from "zod";
import { CollectionService } from "@/lib/services/collection.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const collectionSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().min(2),
  bannerImage: z.string().nullable().optional(),
  thumbnailImage: z.string().nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const { id } = await params;
    const body = await req.json();
    const normalized = {
      ...body,
      bannerImage: body.bannerImage === "" ? null : body.bannerImage,
      thumbnailImage: body.thumbnailImage === "" ? null : body.thumbnailImage,
      seoTitle: body.seoTitle === "" ? null : body.seoTitle,
      seoDescription: body.seoDescription === "" ? null : body.seoDescription,
    };
    const parsed = collectionSchema.partial().safeParse(normalized);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid collection", 422);
    }
    const collection = await CollectionService.update(id, parsed.data);
    return ok(collection);
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
    await CollectionService.remove(id);
    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
