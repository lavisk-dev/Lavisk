"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { Reveal } from "@/components/shared/reveal";
import { formatCurrency } from "@/lib/utils";

export function TrendingMarquee({ products }: { products: Product[] }) {
  const [paused, setPaused] = useState(false);
  // Double the list so the -50% translate loops seamlessly.
  const loop = [...products, ...products];

  return (
    <section id="trending" className="mt-14 scroll-mt-24 md:mt-16">
      <Reveal className="mb-5 flex items-end justify-between gap-2.5">
        <h2 className="font-display text-[clamp(22px,2.6vw,30px)] font-bold tracking-[-0.03em]">
          Trending now
        </h2>
        <Link
          href="/shop?filter=trending"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition hover:opacity-70"
        >
          Shop all
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </Reveal>

      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]"
      >
        <div
          className="flex w-max animate-marquee gap-[18px]"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {loop.map((product, i) => (
            <Link
              key={`${product.id}-${i}`}
              href={`/product/${product.slug}`}
              className="w-[230px] flex-shrink-0 rounded-[22px] bg-white p-3.5 shadow-[0_18px_44px_-30px_rgba(255,76,130,0.45)] transition hover:-translate-y-1"
            >
              <div
                className="h-[150px] rounded-2xl"
                style={{
                  background: `linear-gradient(150deg, ${product.gradientFrom}, ${product.gradientTo})`,
                }}
              />
              <div className="mt-3 text-[15px] font-semibold text-ink">{product.name}</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-bold text-brand">{formatCurrency(product.price)}</span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Star className="h-3 w-3 fill-brand-light text-brand-light" />
                  {product.rating}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
