import type { Metadata } from "next";
import { CartClient } from "@/components/products/cart-client";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Your gift bag",
  description: "Review the gifts in your bag before checkout.",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-16 md:px-8">
      <PageHeader eyebrow="Almost there" title="Your gift bag" />
      <CartClient />
    </div>
  );
}
