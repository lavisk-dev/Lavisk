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
  isActive: z.boolean().default(true),
  usageLimit: z.number().int().min(1).optional(),
});

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const coupons = await CouponService.list();
    return ok(coupons);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const parsed = couponSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid coupon", 422);
    }
    const coupon = await CouponService.create(parsed.data);
    return ok(coupon, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
