"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const TITLES: { match: RegExp; label: string }[] = [
  { match: /^\/admin\/?$/, label: "Dashboard" },
  { match: /^\/admin\/products\/new/, label: "New Product" },
  { match: /^\/admin\/products\/[^/]+$/, label: "Edit Product" },
  { match: /^\/admin\/products/, label: "Products" },
  { match: /^\/admin\/categories/, label: "Categories" },
  { match: /^\/admin\/orders\/[^/]+$/, label: "Order Details" },
  { match: /^\/admin\/orders/, label: "Orders" },
  { match: /^\/admin\/customers/, label: "Customers" },
  { match: /^\/admin\/coupons/, label: "Coupons" },
  { match: /^\/admin\/reviews/, label: "Reviews" },
  { match: /^\/admin\/banners/, label: "Banners" },
  { match: /^\/admin\/analytics/, label: "Analytics" },
  { match: /^\/admin\/settings/, label: "Settings" },
];

function titleFor(pathname: string): string {
  return TITLES.find((t) => t.match.test(pathname))?.label ?? "Admin";
}

export function AdminTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/admin/auth?action=logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-bg/80 px-5 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="max-w-xs p-0">
            <AdminSidebar />
          </SheetContent>
        </Sheet>
        <h1 className="font-display text-xl font-bold text-ink md:text-2xl">
          {titleFor(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={handleLogout} disabled={isPending} title="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
