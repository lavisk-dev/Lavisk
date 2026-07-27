import type { NextRequest } from "next/server";
import { z } from "zod";
import { OrderEngine } from "@/lib/services/order-engine.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const refundSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(2, "Reason is required"),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const parsed = refundSchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
    const { orderId, reason } = parsed.data;
    const order = await OrderEngine.refundOrder(orderId, reason, "admin");
    if (!order) return fail("Order not found", 404);
    return ok(order);
  } catch (error) {
    if (error instanceof Error) return fail(error.message, 400);
    return serverError(error);
  }
}