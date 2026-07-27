import "server-only";
import crypto from "crypto";
import Razorpay from "razorpay";
import { config } from "@/lib/core/config";
import type {
  PaymentProvider,
  CreatePaymentOrderInput,
  CreatePaymentOrderResult,
  VerifyPaymentInput,
  CreateRefundInput,
  CreateRefundResult,
} from "@/lib/services/payment/payment-provider";

const keyId = config.payment.razorpay.keyId;
const keySecret = config.payment.razorpay.keySecret;
const webhookSecret = config.payment.razorpay.webhookSecret;

export const isRazorpayConfigured = config.payment.razorpay.isConfigured;

function getClient() {
  if (!isRazorpayConfigured) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
    );
  }
  return new Razorpay({ key_id: keyId as string, key_secret: keySecret as string });
}

export const RazorpayService: PaymentProvider = {
  name: "razorpay",

  async createOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
    const client = getClient();
    const order = await client.orders.create({
      amount: Math.round(input.amount * 100), // paise
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    });

    return {
      providerOrderId: order.id,
      amount: input.amount,
      currency: input.currency,
      keyId: keyId as string,
    };
  },

  async verifyPayment(input: VerifyPaymentInput): Promise<boolean> {
    if (!isRazorpayConfigured) return false;
    const body = `${input.providerOrderId}|${input.providerPaymentId}`;
    const expected = crypto
      .createHmac("sha256", keySecret as string)
      .update(body)
      .digest("hex");
    return expected === input.signature;
  },

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!webhookSecret) return false;
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");
    return expected === signature;
  },

  async createRefund(input: CreateRefundInput): Promise<CreateRefundResult> {
    const client = getClient();
    const refund = await client.payments.refund(input.providerPaymentId, {
      amount: Math.round(input.amount * 100),
      notes: { reason: input.reason },
    });
    return {
      providerRefundId: refund.id,
      status: refund.status,
      amount: input.amount,
    };
  },
};
