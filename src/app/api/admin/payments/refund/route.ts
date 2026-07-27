import type { NextRequest } from "next/server";
import { z } from "zod";
import { PaymentEngine } from "@/lib/services/payment-engine.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const refundSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const parsed = refundSchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
    const { paymentId, amount, reason } = parsed.data;
    const refund = await PaymentEngine.processRefund(paymentId, amount, reason);
    if (!refund) return fail("Refund could not be processed", 400);
    return ok(refund);
  } catch (error) {
    if (error instanceof Error) return fail(error.message, 400);
    return serverError(error);
  }
}