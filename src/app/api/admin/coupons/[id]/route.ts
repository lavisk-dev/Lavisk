import type { NextRequest } from "next/server";
import { z } from "zod";
import { CouponService } from "@/lib/services/coupon.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const couponSchema = z.object({
  code: z.string().min(2).transform((v) => v.toUpperCase()),
  type: z.enum(["percentage", "flat"]),
  value: z.number().min(0),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean(),
  usageLimit: z.number().int().min(1).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const { id } = await params;
    const parsed = couponSchema.partial().safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid coupon", 422);
    }
    const coupon = await CouponService.update(id, parsed.data);
    return ok(coupon);
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
    await CouponService.remove(id);
    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
