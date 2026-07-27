import type { NextRequest } from "next/server";
import { z } from "zod";
import { BannerService } from "@/lib/services/banner.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const bannerSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  imagePublicId: z.string().nullable().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const { id } = await params;
    const parsed = bannerSchema.partial().safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid banner", 422);
    }
    const banner = await BannerService.update(id, parsed.data);
    return ok(banner);
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
    await BannerService.remove(id);
    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
