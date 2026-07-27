import type { NextRequest } from "next/server";
import { z } from "zod";
import { OrderEngine } from "@/lib/services/order-engine.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const statusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    "pending",
    "paid",
    "processing",
    "packed",
    "dispatched",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "refunded",
    "returned",
  ]),
  note: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const parsed = statusSchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
    const { orderId, status, note } = parsed.data;
    const order = await OrderEngine.updateStatus(orderId, status, "admin", note);
    if (!order) return fail("Order not found", 404);
    return ok(order);
  } catch (error) {
    return serverError(error);
  }
}