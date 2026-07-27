import type { NextRequest } from "next/server";
import { PaymentEngine } from "@/lib/services/payment-engine.service";
import { ok, serverError } from "@/lib/utils/api";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";

    const result = await PaymentEngine.handleWebhook("razorpay", rawBody, signature);
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}