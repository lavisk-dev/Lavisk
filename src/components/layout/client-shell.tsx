"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const CartDrawer = dynamic(
  () => import("./cart-drawer").then((m) => m.CartDrawer),
  { ssr: false }
);

const MobileNav = dynamic(
  () => import("./mobile-nav").then((m) => m.MobileNav),
  { ssr: false }
);

const QuickViewModal = dynamic(
  () => import("@/components/products/quick-view-modal").then((m) => m.QuickViewModal),
  { ssr: false }
);

export function ClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isHome = pathname === "/";

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar hideUntilScrolled={isHome} />
      <MobileNav />
      <main className="relative z-[1] min-h-screen">{children}</main>
      <Footer />
      <CartDrawer />
      <QuickViewModal />
    </>
  );
}
