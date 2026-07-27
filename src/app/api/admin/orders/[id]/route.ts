import type { NextRequest } from "next/server";
import { z } from "zod";
import { OrderEngine } from "@/lib/services/order-engine.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const updateSchema = z.object({
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
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const { id } = await params;
    const detail = await OrderEngine.getOrderDetail(id);
    if (!detail) return fail("Order not found", 404);
    return ok(detail);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const { id } = await params;
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid status", 422);
    const order = await OrderEngine.updateStatus(id, parsed.data.status, "admin");
    if (!order) return fail("Order not found", 404);
    return ok(order);
  } catch (error) {
    return serverError(error);
  }
}