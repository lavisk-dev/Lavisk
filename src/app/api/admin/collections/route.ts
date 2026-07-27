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
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
});

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const collections = await CollectionService.list();
    return ok(collections);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const body = await req.json();
    const normalized = {
      ...body,
      bannerImage: body.bannerImage === "" ? null : body.bannerImage,
      thumbnailImage: body.thumbnailImage === "" ? null : body.thumbnailImage,
      seoTitle: body.seoTitle === "" ? null : body.seoTitle,
      seoDescription: body.seoDescription === "" ? null : body.seoDescription,
    };
    const parsed = collectionSchema.safeParse(normalized);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid collection", 422);
    }
    const collection = await CollectionService.create(parsed.data);
    return ok(collection, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}