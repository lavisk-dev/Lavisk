import "server-only";
import type {
  PaymentProvider,
  CreatePaymentOrderInput,
  CreatePaymentOrderResult,
  VerifyPaymentInput,
} from "@/lib/services/payment/payment-provider";

/**
 * Placeholder Stripe adapter for international expansion. Implement
 * against Stripe PaymentIntents (https://stripe.com/docs/payments/payment-intents)
 * following the same shape as razorpay.service.ts.
 */
export const StripeService: PaymentProvider = {
  name: "stripe",

  async createOrder(_input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
    throw new Error("Stripe provider is not yet implemented.");
  },

  async verifyPayment(_input: VerifyPaymentInput): Promise<boolean> {
    throw new Error("Stripe provider is not yet implemented.");
  },

  verifyWebhookSignature(_rawBody: string, _signature: string): boolean {
    return false;
  },
};
