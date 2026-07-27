import type { NextRequest } from "next/server";
import { OrderTimelineService } from "@/lib/services/order-timeline.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const orderId = req.nextUrl.searchParams.get("orderId");
    if (!orderId) return fail("orderId query param is required", 422);
    const timeline = await OrderTimelineService.getByOrderId(orderId);
    return ok(timeline);
  } catch (error) {
    return serverError(error);
  }
}