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
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const banners = await BannerService.listAll();
    return ok(banners);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const parsed = bannerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid banner", 422);
    }
    const banner = await BannerService.create(parsed.data);
    return ok(banner, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
