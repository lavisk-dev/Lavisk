"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Magnetic } from "@/components/shared/magnetic";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, closeCart, increment, decrement } = useCartStore();
  const subtotal = useCartStore((s) => s.subtotal());

  const remainingForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const goToCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="p-0">
        <div className="flex items-center justify-between px-6 pb-4 pt-6">
          <div className="font-display text-2xl font-bold text-ink">Your gift bag</div>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-2">
          {items.length === 0 ? (
            <div className="px-5 py-16 text-center text-[15px] text-muted">
              Your bag is empty — go find something lovely. 🎀
            </div>
          ) : (
            <>
              {remainingForFreeShip > 0 && (
                <p className="mb-4 rounded-2xl bg-brand-mist px-4 py-3 text-center text-xs font-medium text-brand">
                  Add {formatCurrency(remainingForFreeShip)} more for free shipping
                </p>
              )}
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="mb-3 flex items-center gap-3.5 rounded-[20px] bg-white p-3 shadow-[0_14px_40px_-30px_rgba(255,76,130,0.5)]"
                >
                  <div
                    className="h-16 w-16 flex-shrink-0 rounded-[14px]"
                    style={{
                      background: `linear-gradient(150deg, ${item.gradientFrom}, ${item.gradientTo})`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={closeCart}
                      className="line-clamp-1 text-[15px] font-semibold text-ink hover:text-brand"
                    >
                      {item.name}
                    </Link>
                    <div className="mt-0.5 text-[15px] font-bold text-brand">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrement(item.productId)}
                      aria-label="Decrease quantity"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-mist text-lg text-muted transition hover:bg-brand-blush"
                    >
                      −
                    </button>
                    <span className="min-w-5 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => increment(item.productId)}
                      aria-label="Increase quantity"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-mist text-lg text-muted transition hover:bg-brand-blush"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="border-t border-border px-6 pb-7 pt-5">
          <div className="mb-4 flex items-center justify-between text-base">
            <span className="text-muted">Subtotal</span>
            <span className="font-display text-[22px] font-bold text-ink">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <Magnetic className="block w-full">
            <button
              onClick={goToCheckout}
              disabled={items.length === 0}
              className="w-full rounded-full bg-brand py-4 font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(255,76,130,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Checkout →
            </button>
          </Magnetic>
        </div>
      </SheetContent>
    </Sheet>
  );
}
