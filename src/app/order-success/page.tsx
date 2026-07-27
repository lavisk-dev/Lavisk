import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderSuccessClient } from "@/components/checkout/order-success-client";

export const metadata: Metadata = {
  title: "Order confirmed",
  description: "Your gift order is confirmed.",
  robots: { index: false, follow: false },
};

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-muted">Loading…</div>}>
      <OrderSuccessClient />
    </Suspense>
  );
}
