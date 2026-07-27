import "server-only";
import type {
  PaymentProvider,
  CreatePaymentOrderInput,
  CreatePaymentOrderResult,
  VerifyPaymentInput,
} from "@/lib/services/payment/payment-provider";

/**
 * Placeholder Cashfree adapter. Implement against the Cashfree Orders
 * API (https://docs.cashfree.com) following the same shape as
 * razorpay.service.ts — the rest of the app won't need to change.
 */
export const CashfreeService: PaymentProvider = {
  name: "cashfree",

  async createOrder(_input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
    throw new Error("Cashfree provider is not yet implemented.");
  },

  async verifyPayment(_input: VerifyPaymentInput): Promise<boolean> {
    throw new Error("Cashfree provider is not yet implemented.");
  },

  verifyWebhookSignature(_rawBody: string, _signature: string): boolean {
    return false;
  },
};
