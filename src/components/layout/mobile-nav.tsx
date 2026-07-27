"use client";

import Link from "next/link";
import { Search, Heart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BRAND_NAME, MOBILE_NAV_LINKS } from "@/lib/constants";
import { useUIStore } from "@/store/ui-store";

export function MobileNav() {
  const isOpen = useUIStore((s) => s.isMobileNavOpen);
  const closeMobileNav = useUIStore((s) => s.closeMobileNav);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeMobileNav()}>
      <SheetContent side="left" className="w-[86vw] max-w-xs">
        <SheetHeader>
          <SheetTitle>
            {BRAND_NAME}
            <span className="text-brand">.</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-4 py-2">
          {MOBILE_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMobileNav}
              className="rounded-2xl px-4 py-3.5 font-display text-lg font-bold text-ink transition hover:bg-brand-mist"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-border px-4 py-4">
          <Link
            href="/search"
            onClick={closeMobileNav}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted transition hover:bg-brand-mist hover:text-ink"
          >
            <Search className="h-5 w-5" /> Search
          </Link>
          <Link
            href="/wishlist"
            onClick={closeMobileNav}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted transition hover:bg-brand-mist hover:text-ink"
          >
            <Heart className="h-5 w-5" /> Wishlist
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
