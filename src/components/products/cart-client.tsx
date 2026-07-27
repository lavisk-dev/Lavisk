"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_FEE } from "@/lib/constants";

export function CartClient() {
  const router = useRouter();
  const { items, increment, decrement, removeItem } = useCartStore();
  const subtotal = useCartStore((s) => s.subtotal());

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-[28px] bg-white px-6 py-16 text-center shadow-soft">
        <div className="mb-3 text-4xl">🛍️</div>
        <p className="font-display text-xl font-bold">Your gift bag is empty</p>
        <p className="mt-2 text-muted">Find something lovely to gift.</p>
        <Button asChild className="mt-6">
          <Link href="/shop">Start shopping</Link>
        </Button>
      </div>
    );
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
  const total = subtotal + shipping;

  return (
    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 rounded-[24px] bg-white p-4 shadow-soft"
            >
              <Link
                href={`/product/${item.slug}`}
                className="h-20 w-20 flex-shrink-0 rounded-2xl"
                style={{
                  background: `linear-gradient(150deg, ${item.gradientFrom}, ${item.gradientTo})`,
                }}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${item.slug}`}
                  className="font-semibold text-ink hover:text-brand"
                >
                  {item.name}
                </Link>
                <div className="mt-1 font-bold text-brand">{formatCurrency(item.price)}</div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-brand-mist p-1">
                <button
                  onClick={() => decrement(item.productId)}
                  aria-label="Decrease quantity"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-muted transition hover:text-ink"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-6 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => increment(item.productId)}
                  aria-label="Increase quantity"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-muted transition hover:text-ink"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="hidden w-24 text-right font-bold text-ink sm:block">
                {formatCurrency(item.price * item.quantity)}
              </div>
              <button
                onClick={() => removeItem(item.productId)}
                aria-label={`Remove ${item.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-brand-mist hover:text-brand"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="h-fit rounded-[24px] bg-white p-6 shadow-soft lg:sticky lg:top-28">
        <h2 className="font-display text-xl font-bold">Order summary</h2>
        <div className="mt-5 flex flex-col gap-3 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span className="font-semibold text-ink">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Shipping</span>
            <span className="font-semibold text-ink">
              {shipping === 0 ? "Free" : formatCurrency(shipping)}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-4 text-base">
            <span className="font-semibold">Total</span>
            <span className="font-display text-2xl font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
        <Button className="mt-6 w-full" size="lg" onClick={() => router.push("/checkout")}>
          Checkout →
        </Button>
        <Link
          href="/shop"
          className="mt-3 block text-center text-sm font-medium text-muted hover:text-brand"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
