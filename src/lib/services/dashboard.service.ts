import "server-only";
import { OrderService } from "@/lib/services/order.service";
import { ProductService } from "@/lib/services/product.service";
import { CustomerService } from "@/lib/services/customer.service";
import type { DashboardStats, Product } from "@/lib/types";

export const DashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [{ orders }, { products, total: totalProducts }, customers] = await Promise.all([
      OrderService.list({ pageSize: 100 }),
      ProductService.list({ pageSize: 100 }),
      CustomerService.list(),
    ]);

    const paidOrders = orders.filter((o) =>
      ["paid", "processing", "packed", "dispatched", "out_for_delivery", "delivered"].includes(o.status)
    );

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

    // Units sold per product, for the "top products" widget.
    const unitsByProduct = new Map<string, number>();
    for (const order of paidOrders) {
      for (const item of order.items) {
        unitsByProduct.set(item.productId, (unitsByProduct.get(item.productId) ?? 0) + item.quantity);
      }
    }

    const topProducts = [...unitsByProduct.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, unitsSold]) => ({
        product: products.find((p) => p.id === productId),
        unitsSold,
      }))
      .filter((x): x is { product: Product; unitsSold: number } => Boolean(x.product));

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      totalProducts,
      // Static demo deltas — wire these to period-over-period queries once
      // orders are persisted in Supabase.
      revenueChangePct: 12.5,
      ordersChangePct: 8.2,
      recentOrders: orders.slice(0, 6),
      topProducts,
    };
  },
};
