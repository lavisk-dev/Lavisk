import type { Metadata } from "next";
import { WishlistClient } from "@/components/products/wishlist-client";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Gifts you've saved for later.",
};

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-16 md:px-8">
      <PageHeader eyebrow="Saved for later" title="Your wishlist" />
      <WishlistClient />
    </div>
  );
}
