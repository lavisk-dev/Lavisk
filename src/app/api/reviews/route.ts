import type { NextRequest } from "next/server";
import { ReviewService } from "@/lib/services/review.service";
import { reviewSchema } from "@/lib/utils/validation";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) return fail("productId is required", 422);
    const reviews = await ReviewService.listByProduct(productId);
    return ok(reviews);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = reviewSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid review", 422);
    }
    const review = await ReviewService.create(parsed.data);
    return ok(review, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
