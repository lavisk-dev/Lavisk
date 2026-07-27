"use client";

import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/products/product-card";
import { staggerContainer, viewportOnce } from "@/lib/utils/motion";

interface ProductGridProps {
  products: Product[];
  quickView?: boolean;
  columns?: 2 | 3 | 4;
}

const COL_CLASS: Record<number, string> = {
  2: "grid-cols-2 sm:grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
};

export function ProductGrid({ products, quickView = false, columns = 3 }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-[28px] bg-white px-6 py-16 text-center text-muted shadow-soft">
        No gifts here yet — try another occasion or clear your filters.
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className={`grid gap-5 md:gap-[22px] ${COL_CLASS[columns]}`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} quickView={quickView} />
      ))}
    </motion.div>
  );
}
