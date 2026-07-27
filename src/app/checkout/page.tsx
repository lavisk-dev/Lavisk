import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your gift order.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-16 md:px-8">
      <PageHeader eyebrow="Final step" title="Checkout" />
      <CheckoutClient />
    </div>
  );
}
