"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/store/wishlist-store";

export function WishlistClient() {
  const productIds = useWishlistStore((s) => s.productIds);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      // The wishlist stores only IDs; hydrate each via the id endpoint.
      const fetched = await Promise.all(
        productIds.map((id) =>
          fetch(`/api/products/id/${id}`)
            .then((r) => r.json())
            .then((res) => (res.success ? (res.data as Product) : null))
            .catch(() => null)
        )
      );
      if (!cancelled) {
        setProducts(fetched.filter((p): p is Product => Boolean(p)));
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [productIds]);

  if (!loading && products.length === 0) {
    return (
      <div className="mt-10 rounded-[28px] bg-white px-6 py-16 text-center shadow-soft">
        <div className="mb-3 text-4xl">🎀</div>
        <p className="font-display text-xl font-bold">Your wishlist is empty</p>
        <p className="mt-2 text-muted">Tap the heart on any gift to save it for later.</p>
        <Button asChild className="mt-6">
          <Link href="/shop">Browse gifts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-10">
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-[28px] bg-white p-4 shadow-card">
              <div className="h-[250px] rounded-[20px] bg-brand-mist/60" />
              <div className="mt-4 space-y-2 px-2">
                <div className="h-5 w-3/4 rounded-full bg-brand-mist/60" />
                <div className="h-4 w-1/2 rounded-full bg-brand-mist/40" />
                <div className="mt-3 h-7 w-1/3 rounded-full bg-brand-mist/60" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ProductGrid products={products} quickView columns={3} />
      )}
    </div>
  );
}
