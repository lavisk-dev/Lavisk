import "server-only";

export interface CreatePaymentOrderInput {
  amount: number; // in the base currency unit, e.g. dollars
  currency: string; // e.g. "INR" or "USD"
  receipt: string; // internal order number
  notes?: Record<string, string>;
}

export interface CreatePaymentOrderResult {
  providerOrderId: string;
  amount: number;
  currency: string;
  keyId: string; // public key the client SDK needs to open its checkout
}

export interface VerifyPaymentInput {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface CreateRefundInput {
  paymentId: string;
  amount: number;
  reason: string;
  providerOrderId: string;
  providerPaymentId: string;
}

export interface CreateRefundResult {
  providerRefundId: string;
  status: string;
  amount: number;
}

/**
 * Every payment provider (Razorpay, Cashfree, Stripe, ...) implements
 * this interface. Route handlers and the frontend only ever depend on
 * this contract, so swapping providers never touches UI code — set
 * PAYMENT_PROVIDER in the environment and add a case in getPaymentProvider().
 */
export interface PaymentProvider {
  name: string;
  createOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<boolean>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  createRefund?(input: CreateRefundInput): Promise<CreateRefundResult>;
}
