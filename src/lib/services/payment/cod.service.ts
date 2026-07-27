import "server-only";
import type {
  PaymentProvider,
  CreatePaymentOrderInput,
  CreatePaymentOrderResult,
  VerifyPaymentInput,
} from "@/lib/services/payment/payment-provider";

export const CODService: PaymentProvider = {
  name: "cod",

  async createOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
    return {
      providerOrderId: `cod_${Date.now()}`,
      amount: input.amount,
      currency: input.currency,
      keyId: "cod",
    };
  },

  async verifyPayment(_input: VerifyPaymentInput): Promise<boolean> {
    return true;
  },

  verifyWebhookSignature(_rawBody: string, _signature: string): boolean {
    return false;
  },
};