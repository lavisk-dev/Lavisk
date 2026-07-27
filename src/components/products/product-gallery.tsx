"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  gradientFrom: string;
  gradientTo: string;
}

export function ProductGallery({ images, productName, gradientFrom, gradientTo }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex];

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative aspect-square overflow-hidden rounded-[32px] shadow-card"
        style={{
          background: `linear-gradient(150deg, ${gradientFrom}, ${gradientTo})`,
        }}
      >
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active.publicId || active.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative h-full w-full"
            >
              <Image
                src={active.url}
                alt={active.alt || productName}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover"
              />
            </motion.div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-white/60">No image</span>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {sorted.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {sorted.map((img, i) => (
            <button
              key={img.publicId || i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition",
                i === activeIndex ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt={img.alt || `${productName} thumbnail ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}