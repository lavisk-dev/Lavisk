import type { NextRequest } from "next/server";
import { z } from "zod";
import { PaymentEngine } from "@/lib/services/payment-engine.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";
import { CURRENCY } from "@/lib/constants";

const retrySchema = z.object({
  paymentId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const parsed = retrySchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
    const { paymentId } = parsed.data;
    const detail = await PaymentEngine.getPaymentDetail(paymentId);
    if (!detail.payment) return fail("Payment not found", 404);
    if (detail.payment.status !== "failed" && detail.payment.status !== "cancelled") {
      return fail("Only failed or cancelled payments can be retried", 400);
    }
    const { payment } = await PaymentEngine.createPayment(
      detail.payment.orderId,
      detail.payment.provider,
      detail.payment.amount,
      CURRENCY.code
    );
    return ok({ payment, previousPaymentId: paymentId });
  } catch (error) {
    if (error instanceof Error) return fail(error.message, 400);
    return serverError(error);
  }
}