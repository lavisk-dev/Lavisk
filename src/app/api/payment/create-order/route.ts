import type { NextRequest } from "next/server";
import { createPaymentOrderSchema } from "@/lib/utils/validation";
import { PaymentEngine } from "@/lib/services/payment-engine.service";
import { config } from "@/lib/core/config";
import { ok, fail, serverError } from "@/lib/utils/api";
import { CURRENCY } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const parsed = createPaymentOrderSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid checkout", 422);
    }
    const { items, couponCode, customer } = parsed.data;

    const { CartService } = await import("@/lib/services/cart.service");
    const { CouponService } = await import("@/lib/services/coupon.service");
    const { OrderService } = await import("@/lib/services/order.service");

    const priced = await CartService.price(items);
    if (priced.lines.length === 0) return fail("Your cart is empty", 422);
    if (priced.hasIssues) {
      return fail("Some items are out of stock or unavailable. Please review your bag.", 409);
    }

    let discount = 0;
    let appliedCoupon: string | null = null;
    if (couponCode) {
      const validation = await CouponService.validate(couponCode, priced.subtotal);
      if (validation.valid && validation.coupon) {
        discount = validation.discount;
        appliedCoupon = couponCode.toUpperCase();
        await CouponService.incrementUsage(validation.coupon.id);
      }
    }

    const total = Math.max(0, Math.round((priced.subtotal + priced.shipping - discount) * 100) / 100);

    const order = await OrderService.create({
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      shippingAddress: customer.shippingAddress,
      items: priced.lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        price: l.price,
        quantity: l.quantity,
      })),
      subtotal: priced.subtotal,
      discount,
      shipping: priced.shipping,
      total,
      couponCode: appliedCoupon,
      status: "pending",
      paymentProvider: config.payment.provider,
      giftNote: customer.giftNote ?? null,
    });

    const { providerOrderId, keyId } = await PaymentEngine.createPayment(
      order.id,
      order.paymentProvider,
      total,
      CURRENCY.code
    );

    return ok({
      mock: keyId === "cod" ? false : !keyId.includes("mock"),
      orderId: order.id,
      orderNumber: order.orderNumber,
      providerOrderId,
      amount: total,
      currency: CURRENCY.code,
      keyId,
    });
  } catch (error) {
    return serverError(error);
  }
}