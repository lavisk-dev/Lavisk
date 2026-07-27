"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Magnetic } from "@/components/shared/magnetic";
import type { Product } from "@/lib/types";
import { useUIStore } from "@/store/ui-store";
import { useCartStore } from "@/store/cart-store";
import { ProductService } from "@/lib/services/product.service";
import { formatCurrency } from "@/lib/utils";

/**
 * Client wrapper that fetches the active product via the products API
 * (the service layer is server-only) whenever the quick-view opens.
 */
export function QuickViewModal() {
  const quickViewProductId = useUIStore((s) => s.quickViewProductId);
  const closeQuickView = useUIStore((s) => s.closeQuickView);
  const addItem = useCartStore((s) => s.addItem);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!quickViewProductId) {
      setProduct(null);
      return;
    }
    setLoading(true);
    fetch(`/api/products/id/${quickViewProductId}`)
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled && res.success) setProduct(res.data);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [quickViewProductId]);

  const open = Boolean(quickViewProductId);

  const handleAdd = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      gradientFrom: product.gradientFrom,
      gradientTo: product.gradientTo,
      image: product.images[0]?.url ?? null,
    });
    closeQuickView();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeQuickView()}>
      <DialogContent className="max-w-[860px] overflow-hidden p-0">
        {loading || !product ? (
          <div className="flex h-[440px] items-center justify-center text-muted">Loading…</div>
        ) : (
          <div className="flex flex-col md:flex-row">
            <div
              className="relative min-h-[240px] flex-1 md:min-h-[440px]"
              style={{
                background: `linear-gradient(150deg, ${product.gradientFrom}, ${product.gradientTo})`,
              }}
            >
              {product.images[0]?.url && (
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 430px"
                  className="object-cover"
                />
              )}
              {product.tag && (
                <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.06em] text-brand">
                  {product.tag}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-8 md:p-11">
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

              <DialogTitle className="mt-3.5 font-display text-[34px] font-bold tracking-[-0.02em]">
                {product.name}
              </DialogTitle>
              <DialogDescription className="mt-2 text-base text-muted">
                {product.description}
              </DialogDescription>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{product.story}</p>

              <div className="flex-1" />

              <div className="my-6 font-display text-[38px] font-extrabold text-ink">
                {formatCurrency(product.price)}
              </div>
              <Magnetic className="block w-full">
                <button
                  onClick={handleAdd}
                  className="w-full animate-ctaPulse rounded-full bg-brand py-4 font-bold text-white transition hover:-translate-y-0.5"
                >
                  Add to bag →
                </button>
              </Magnetic>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
