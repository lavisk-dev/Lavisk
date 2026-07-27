"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Archive,
  ShoppingBag,
  Users,
  TicketPercent,
  MessageSquareText,
  Image as ImageIcon,
  BarChart3,
  Settings,
  ClipboardList,
  Warehouse,
  CreditCard,
  Bell,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/constants";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Collections", href: "/admin/collections", icon: Archive },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Shipping", href: "/admin/shipping", icon: Truck },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Coupons", href: "/admin/coupons", icon: TicketPercent },
  { label: "Reviews", href: "/admin/reviews", icon: MessageSquareText },
  { label: "Banners", href: "/admin/banners", icon: ImageIcon },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Activity Log", href: "/admin/activity", icon: ClipboardList },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-white lg:flex">
      <div className="flex h-20 items-center gap-2 border-b border-border px-6">
        <span className="font-display text-2xl font-extrabold text-ink">
          {BRAND_NAME}
          <span className="text-brand">.</span>
        </span>
        <span className="rounded-full bg-brand-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
          Admin
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-brand text-white shadow-soft"
                  : "text-muted hover:bg-brand-mist hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <Link
          href="/"
          className="flex items-center justify-center rounded-full border border-border py-2 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
        >
          ← Back to storefront
        </Link>
      </div>
    </aside>
  );
}
