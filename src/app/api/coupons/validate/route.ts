import type { NextRequest } from "next/server";
import { CouponService } from "@/lib/services/coupon.service";
import { couponValidateSchema } from "@/lib/utils/validation";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function POST(req: NextRequest) {
  try {
    const parsed = couponValidateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid request", 422);
    }
    const result = await CouponService.validate(parsed.data.code, parsed.data.subtotal);
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}
