import type { NextRequest } from "next/server";
import { PaymentEngine } from "@/lib/services/payment-engine.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const { id } = await params;
    const detail = await PaymentEngine.getPaymentDetail(id);
    if (!detail.payment) return fail("Payment not found", 404);
    return ok(detail);
  } catch (error) {
    return serverError(error);
  }
}