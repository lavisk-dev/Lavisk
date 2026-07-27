"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, ShoppingBag, Menu, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_NAME, NAV_LINKS } from "@/lib/constants";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useUIStore } from "@/store/ui-store";

interface NavShellProps {
  /** "light" = inside the pink hero card (white text on transparent — matches
   *  the source design row: logo · 4 links · search + cart).
   *  "solid" = frosted white sticky bar (dark text, adds wishlist icon since
   *  we have more room on the fixed nav). */
  tone: "light" | "solid";
}

export function NavShell({ tone }: NavShellProps) {
  const [mounted, setMounted] = useState(false);
  const openCart = useCartStore((s) => s.openCart);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useWishlistStore((s) => s.productIds.length);
  const openMobileNav = useUIStore((s) => s.openMobileNav);

  useEffect(() => setMounted(true), []);

  const isLight = tone === "light";

  return (
    <nav
      className="flex items-center justify-between gap-6 text-white"
      aria-label="Primary"
    >
      {/* Logo — 24px extrabold Bricolage, brand accent dot */}
      <Link
        href="/"
        className={cn(
          "font-display text-2xl font-extrabold tracking-[-0.02em] transition-colors",
          isLight ? "text-white" : "text-ink"
        )}
      >
        {BRAND_NAME}
        <span className={isLight ? "text-brand-blush" : "text-brand"}>.</span>
      </Link>

      {/* 4 nav links, 34px gap, 15px medium — exact spec from the source design */}
      <div className="hidden items-center gap-[34px] text-[15px] font-medium md:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "transition-opacity",
              isLight
                ? "text-white/90 hover:text-white"
                : "text-ink/80 hover:text-brand"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-[18px]">
        {/* Search icon */}
        <Link
          href="/search"
          aria-label="Search gifts"
          className={cn(
            "hidden h-10 w-10 items-center justify-center rounded-full transition-opacity sm:flex",
            isLight ? "text-white opacity-90 hover:opacity-100" : "text-ink hover:bg-brand/10"
          )}
        >
          <Search className="h-5 w-5" strokeWidth={2} />
        </Link>

        {/* Wishlist — only shown on the solid sticky nav where we have more room */}
        {!isLight && (
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-brand/10 sm:flex"
          >
            <Heart className="h-5 w-5" />
            {mounted && wishCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                {wishCount}
              </span>
            )}
          </Link>
        )}

        {/* Cart pill — 42×42, white/16 bg + white/30 border + backdrop-blur when light */}
        <button
          onClick={openCart}
          aria-label="Open cart"
          className={cn(
            "relative flex h-[42px] w-[42px] items-center justify-center rounded-full border transition",
            isLight
              ? "border-white/30 bg-white/[0.16] text-white backdrop-blur-[6px] hover:bg-white/25"
              : "border-brand/20 bg-white text-brand hover:bg-brand/5"
          )}
        >
          <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2} />
          {mounted && cartCount > 0 && (
            <span
              className={cn(
                "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-[5px] text-[11px] font-bold",
                isLight ? "bg-white text-brand" : "bg-brand text-white"
              )}
            >
              {cartCount}
            </span>
          )}
        </button>

        {/* Mobile menu — hidden on desktop so the hero row exactly matches the design */}
        <button
          onClick={openMobileNav}
          aria-label="Open menu"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition md:hidden",
            isLight ? "text-white hover:bg-white/15" : "text-ink hover:bg-brand/10"
          )}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </nav>
  );
}
