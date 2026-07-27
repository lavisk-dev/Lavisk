import type { NextRequest } from "next/server";
import { verifyPaymentSchema } from "@/lib/utils/validation";
import { PaymentEngine } from "@/lib/services/payment-engine.service";
import { config } from "@/lib/core/config";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function POST(req: NextRequest) {
  try {
    const parsed = verifyPaymentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid verification", 422);
    }
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

    const payment = await PaymentEngine.verifyPayment(
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      config.payment.provider
    );

    if (!payment) return fail("Payment not found", 404);

    const { OrderService } = await import("@/lib/services/order.service");
    const order = await OrderService.getById(orderId);
    if (!order) return fail("Order not found", 404);

    return ok({ orderNumber: order.orderNumber, mock: false });
  } catch (error) {
    return serverError(error);
  }
}