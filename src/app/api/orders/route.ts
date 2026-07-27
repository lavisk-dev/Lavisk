import type { NextRequest } from "next/server";
import { OrderService } from "@/lib/services/order.service";
import { CartService } from "@/lib/services/cart.service";
import { CouponService } from "@/lib/services/coupon.service";
import { checkoutSchema } from "@/lib/utils/validation";
import { ok, fail, serverError } from "@/lib/utils/api";

/** Look up an order by its human-facing order number (?orderNumber=...). */
export async function GET(req: NextRequest) {
  try {
    const orderNumber = req.nextUrl.searchParams.get("orderNumber");
    if (!orderNumber) return fail("orderNumber is required", 422);
    const order = await OrderService.getByOrderNumber(orderNumber);
    if (!order) return fail("Order not found", 404);
    return ok(order);
  } catch (error) {
    return serverError(error);
  }
}

/**
 * Directly create an order (e.g. cash-on-delivery flows or admin use).
 * The Razorpay flow goes through /api/payment/create-order instead.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = checkoutSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid order", 422);
    }
    const input = parsed.data;

    const priced = await CartService.price(input.items);
    if (priced.hasIssues) return fail("Some items are unavailable.", 409);

    let discount = 0;
    let appliedCoupon: string | null = null;
    if (input.couponCode) {
      const validation = await CouponService.validate(input.couponCode, priced.subtotal);
      if (validation.valid && validation.coupon) {
        discount = validation.discount;
        appliedCoupon = input.couponCode.toUpperCase();
        await CouponService.incrementUsage(validation.coupon.id);
      }
    }

    const total = Math.max(0, Math.round((priced.subtotal + priced.shipping - discount) * 100) / 100);

    const order = await OrderService.create({
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      shippingAddress: input.shippingAddress,
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
      paymentProvider: "manual",
      giftNote: input.giftNote ?? null,
    });

    return ok(order, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
