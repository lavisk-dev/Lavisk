"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/store/cart-store";
import { useRazorpay, type RazorpayResponse } from "@/hooks/use-razorpay";
import { formatCurrency } from "@/lib/utils";
import { BRAND_NAME, FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_FEE } from "@/lib/constants";

const formSchema = z.object({
  fullName: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  line1: z.string().min(3, "Please enter your street address"),
  line2: z.string().optional(),
  city: z.string().min(2, "Please enter your city"),
  state: z.string().min(2, "Please enter your state"),
  postalCode: z.string().min(3, "Please enter your postal code"),
  country: z.string().min(2, "Please enter your country"),
  giftNote: z.string().max(300).optional(),
});
type FormValues = z.infer<typeof formSchema>;

export function CheckoutClient() {
  const router = useRouter();
  const { items, clear } = useCartStore();
  const subtotal = useCartStore((s) => s.subtotal());
  const { openCheckout } = useRazorpay();

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { country: "India" },
  });

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
  const total = Math.max(0, subtotal + shipping - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotal }),
    });
    const json = await res.json();
    if (json.success && json.data.valid) {
      setDiscount(json.data.discount);
      setCouponMsg({ ok: true, text: `Applied — you saved ${formatCurrency(json.data.discount)}` });
    } else {
      setDiscount(0);
      setCouponMsg({ ok: false, text: json.data?.reason ?? "That code didn't work." });
    }
  };

  const onSubmit = async (values: FormValues) => {
    setProcessing(true);
    setError(null);

    try {
      const createRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          couponCode: discount > 0 ? couponCode : undefined,
          customer: {
            name: values.fullName,
            email: values.email,
            phone: values.phone,
            giftNote: values.giftNote,
            shippingAddress: {
              fullName: values.fullName,
              phone: values.phone,
              line1: values.line1,
              line2: values.line2,
              city: values.city,
              state: values.state,
              postalCode: values.postalCode,
              country: values.country,
            },
          },
        }),
      });

      const created = await createRes.json();
      if (!created.success) throw new Error(created.error ?? "Could not start checkout.");

      const { orderId, providerOrderId, amount, currency, keyId, mock } = created.data;

      const finalize = async (paymentResponse: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const verifyRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            razorpayOrderId: paymentResponse.razorpay_order_id,
            razorpayPaymentId: paymentResponse.razorpay_payment_id,
            razorpaySignature: paymentResponse.razorpay_signature,
          }),
        });
        const verified = await verifyRes.json();
        if (!verified.success) throw new Error(verified.error ?? "Payment verification failed.");
        clear();
        router.push(`/order-success?order=${verified.data.orderNumber}`);
      };

      if (mock) {
        // No live payment keys — simulate a successful capture so the
        // full flow (order + success page + emails) can be demonstrated.
        await finalize({
          razorpay_order_id: providerOrderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock_signature",
        });
        return;
      }

      await openCheckout({
        key: keyId,
        amount: Math.round(amount * 100),
        currency,
        name: BRAND_NAME,
        description: "Gift order",
        order_id: providerOrderId,
        prefill: { name: values.fullName, email: values.email, contact: values.phone },
        theme: { color: "#FF4C82" },
        handler: (response: RazorpayResponse) => {
          finalize(response).catch((e) => setError(e.message));
        },
        modal: { ondismiss: () => setProcessing(false) },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-[28px] bg-white px-6 py-16 text-center shadow-soft">
        <p className="font-display text-xl font-bold">Your bag is empty</p>
        <Button asChild className="mt-6">
          <Link href="/shop">Browse gifts</Link>
        </Button>
      </div>
    );
  }

  const inputError = (msg?: string) =>
    msg ? <span className="text-xs text-destructive">{msg}</span> : null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3"
    >
      <div className="lg:col-span-2">
        <div className="rounded-[24px] bg-white p-6 shadow-soft md:p-8">
          <h2 className="font-display text-xl font-bold">Shipping details</h2>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" {...register("fullName")} placeholder="Jamie Rivera" />
              {inputError(errors.fullName?.message)}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="you@email.com" />
              {inputError(errors.email?.message)}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} placeholder="+91 98765 43210" />
              {inputError(errors.phone?.message)}
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="line1">Address line 1</Label>
              <Input id="line1" {...register("line1")} placeholder="12 Lotus Lane" />
              {inputError(errors.line1?.message)}
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="line2">Address line 2 (optional)</Label>
              <Input id="line2" {...register("line2")} placeholder="Apartment, suite, etc." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} placeholder="Chennai" />
              {inputError(errors.city?.message)}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register("state")} placeholder="Tamil Nadu" />
              {inputError(errors.state?.message)}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="postalCode">Postal code</Label>
              <Input id="postalCode" {...register("postalCode")} placeholder="600001" />
              {inputError(errors.postalCode?.message)}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register("country")} placeholder="India" />
              {inputError(errors.country?.message)}
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="giftNote">Gift note (optional)</Label>
              <Textarea
                id="giftNote"
                {...register("giftNote")}
                placeholder="Add a message to tuck inside the box…"
                className="min-h-[90px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-fit rounded-[24px] bg-white p-6 shadow-soft lg:sticky lg:top-28">
        <h2 className="font-display text-xl font-bold">Your order</h2>

        <div className="mt-5 flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between text-sm">
              <span className="text-muted">
                {item.name} × {item.quantity}
              </span>
              <span className="font-semibold text-ink">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                className="pl-10"
              />
            </div>
            <Button type="button" variant="subtle" onClick={applyCoupon}>
              Apply
            </Button>
          </div>
          {couponMsg && (
            <p className={`mt-2 text-xs ${couponMsg.ok ? "text-emerald-600" : "text-destructive"}`}>
              {couponMsg.text}
            </p>
          )}
          <p className="mt-2 text-xs text-muted">Try WELCOME10 for 10% off.</p>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span className="font-semibold text-ink">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Shipping</span>
            <span className="font-semibold text-ink">
              {shipping === 0 ? "Free" : formatCurrency(shipping)}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span className="font-semibold">−{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-4 text-base">
            <span className="font-semibold">Total</span>
            <span className="font-display text-2xl font-bold">{formatCurrency(total)}</span>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="mt-6 w-full" size="lg" disabled={processing}>
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </>
          ) : (
            <>Pay {formatCurrency(total)} →</>
          )}
        </Button>
        <p className="mt-3 text-center text-xs text-muted">
          Secure checkout · You won&apos;t be charged until you confirm.
        </p>
      </div>
    </form>
  );
}
