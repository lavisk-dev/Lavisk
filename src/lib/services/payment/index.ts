import "server-only";
import type { PaymentProvider } from "@/lib/services/payment/payment-provider";
import { config } from "@/lib/core/config";
import { RazorpayService } from "@/lib/services/payment/razorpay.service";
import { CashfreeService } from "@/lib/services/payment/cashfree.service";
import { StripeService } from "@/lib/services/payment/stripe.service";
import { CODService } from "@/lib/services/payment/cod.service";

const providers: Record<string, PaymentProvider> = {
  razorpay: RazorpayService,
  cashfree: CashfreeService,
  stripe: StripeService,
  cod: CODService,
};

export function getPaymentProvider(): PaymentProvider {
  const key = config.payment.provider;
  const provider = providers[key];
  if (!provider) {
    throw new Error(`Unknown payment provider "${key}". Check PAYMENT_PROVIDER.`);
  }
  return provider;
}

export * from "@/lib/services/payment/payment-provider";
