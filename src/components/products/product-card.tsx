"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useUIStore } from "@/store/ui-store";
import { formatCurrency, cn } from "@/lib/utils";
import { revealUp } from "@/lib/utils/motion";

interface ProductCardProps {
  product: Product;
  /** Opens the quick-view modal on card click instead of navigating. */
  quickView?: boolean;
}

export function ProductCard({ product, quickView = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => s.productIds.includes(product.id));
  const openQuickView = useUIStore((s) => s.openQuickView);

  const cover = product.images[0]?.url;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      gradientFrom: product.gradientFrom,
      gradientTo: product.gradientTo,
      image: cover ?? null,
    });
  };

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWish(product.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (quickView) {
      e.preventDefault();
      openQuickView(product.id);
    }
  };

  return (
    <motion.div variants={revealUp}>
      <Link
        href={`/product/${product.slug}`}
        onClick={handleCardClick}
        className="group relative block cursor-pointer rounded-[24px] bg-white p-3.5 shadow-card transition-all duration-[450ms] hover:-translate-y-2 hover:rotate-[-1deg] hover:shadow-[0_40px_70px_-34px_rgba(255,76,130,0.55)]"
      >
        <div
          className="relative h-[200px] overflow-hidden rounded-[20px]"
          style={{
            background: `linear-gradient(150deg, ${product.gradientFrom}, ${product.gradientTo})`,
          }}
        >
          {cover && (
            <Image
              src={cover}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          {product.tag && (
            <span className="absolute left-3.5 top-3.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-brand">
              {product.tag}
            </span>
          )}
          <button
            onClick={handleWish}
            aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWished}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition hover:scale-110"
          >
            <Heart
              className={cn("h-[18px] w-[18px] text-brand", isWished && "fill-brand")}
            />
          </button>
        </div>

        <div className="px-2 pb-1.5 pt-3">
          <div className="text-lg font-semibold tracking-[-0.01em] text-ink">{product.name}</div>
          <div className="mt-0.5 text-sm text-muted">{product.description}</div>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-display text-base font-bold text-ink md:text-xl">
              {formatCurrency(product.price)}
            </span>
            <button
                onClick={handleAdd}
                className="rounded-full bg-brand px-3 py-1.5 text-[11px] font-bold text-white transition duration-300 hover:scale-110 hover:shadow-[0_12px_30px_-10px rgba(255,76,130,0.7)] md:px-4 md:py-2.5 md:text-[13px]"
              >
                Add to cart
              </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
