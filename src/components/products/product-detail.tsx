"use client";

import { useState } from "react";
import { Star, Heart, Minus, Plus, Truck, Gift, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { Magnetic } from "@/components/shared/magnetic";
import { ProductGallery } from "@/components/products/product-gallery";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { formatCurrency, cn } from "@/lib/utils";

export function ProductDetail({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => s.productIds.includes(product.id));

  const cover = product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url;

  const handleAdd = () => {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        gradientFrom: product.gradientFrom,
        gradientTo: product.gradientTo,
        image: cover ?? null,
      },
      quantity
    );
    openCart();
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
      <ProductGallery
        images={product.images}
        productName={product.name}
        gradientFrom={product.gradientFrom}
        gradientTo={product.gradientTo}
      />

      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-light">
          <span className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-4 w-4 fill-brand-light text-brand-light"
                style={{ opacity: i < Math.round(product.rating) ? 1 : 0.3 }}
              />
            ))}
          </span>
          <span className="text-muted">
            {product.rating} · {product.reviewCount} reviews
          </span>
        </div>

        <h1 className="mt-3 font-display text-[clamp(32px,4vw,48px)] font-bold leading-tight tracking-[-0.02em]">
          {product.name}
        </h1>
        <p className="mt-3 text-lg text-muted">{product.description}</p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{product.story}</p>

        <div className="mt-6 flex items-baseline gap-3">
          <span className="font-display text-[40px] font-extrabold text-ink">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-lg text-muted line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-white p-1.5 shadow-soft">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-mist text-muted transition hover:bg-brand-blush"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-8 text-center font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.stock || 20, q + 1))}
              aria-label="Increase quantity"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-mist text-muted transition hover:bg-brand-blush"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <Magnetic>
            <button
              onClick={handleAdd}
              className="rounded-full bg-brand px-9 py-4 font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(255,76,130,0.7)]"
            >
              Add to bag → {formatCurrency(product.price * quantity)}
            </button>
          </Magnetic>

          <button
            onClick={() => toggleWish(product.id)}
            aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWished}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white shadow-soft transition hover:scale-105"
          >
            <Heart className={cn("h-5 w-5 text-brand", isWished && "fill-brand")} />
          </button>
        </div>

        <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: Truck, label: "Free shipping over $50" },
            { icon: Gift, label: "Complimentary wrapping" },
            { icon: ShieldCheck, label: "Secure checkout" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-muted shadow-soft"
            >
              <Icon className="h-5 w-5 shrink-0 text-brand" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}