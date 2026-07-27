import { OrderService } from "@/lib/services/order.service";
import { ProductService } from "@/lib/services/product.service";
import { CategoryService } from "@/lib/services/category.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "packed",
  "dispatched",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
  "returned",
];

export default async function AdminAnalyticsPage() {
  const [{ orders }, { products }, categories] = await Promise.all([
    OrderService.list({ pageSize: 200 }),
    ProductService.list({ pageSize: 200 }),
    CategoryService.list(),
  ]);

  const revenueByCategory = categories.map((category) => {
    const revenue = orders
      .flatMap((o) => o.items)
      .filter((item) => products.find((p) => p.id === item.productId)?.categorySlug === category.slug)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { category, revenue };
  });
  const maxRevenue = Math.max(1, ...revenueByCategory.map((r) => r.revenue));

  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }));
  const maxStatusCount = Math.max(1, ...statusCounts.map((s) => s.count));

  const avgOrderValue =
    orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">
              Average order value
            </div>
            <div className="mt-2 font-display text-3xl font-extrabold text-ink">
              {formatCurrency(avgOrderValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">
              Total orders
            </div>
            <div className="mt-2 font-display text-3xl font-extrabold text-ink">
              {orders.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">
              Active products
            </div>
            <div className="mt-2 font-display text-3xl font-extrabold text-ink">
              {products.filter((p) => p.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {revenueByCategory.map(({ category, revenue }) => (
              <div key={category.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-ink">{category.name}</span>
                  <span className="font-semibold text-ink">{formatCurrency(revenue)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-mist">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {statusCounts.map(({ status, count }) => (
              <div key={status}>
                <div className="mb-1 flex justify-between text-sm capitalize">
                  <span className="text-ink">{status}</span>
                  <span className="font-semibold text-ink">{count}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-mist">
                  <div
                    className="h-full rounded-full bg-apricot"
                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
