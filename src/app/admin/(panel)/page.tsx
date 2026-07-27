import Link from "next/link";
import { DollarSign, ShoppingBag, Users, Package } from "lucide-react";
import { DashboardService } from "@/lib/services/dashboard.service";
import { StatCard } from "@/components/admin/stat-card";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const stats = await DashboardService.getStats();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={formatCurrency(stats.totalRevenue)}
          changePct={stats.revenueChangePct}
          icon={DollarSign}
          accent="#FFE9EF"
        />
        <StatCard
          label="Total orders"
          value={String(stats.totalOrders)}
          changePct={stats.ordersChangePct}
          icon={ShoppingBag}
          accent="#FFEBDF"
        />
        <StatCard label="Customers" value={String(stats.totalCustomers)} icon={Users} accent="#F3ECFF" />
        <StatCard label="Products" value={String(stats.totalProducts)} icon={Package} accent="#FFF0F3" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Link href="/admin/orders" className="text-sm font-semibold text-brand">
              View all →
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold text-ink hover:text-brand">
                        {order.orderNumber}
                      </Link>
                      <div className="text-xs text-muted">{formatDate(order.createdAt)}</div>
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(order.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {stats.topProducts.length === 0 && (
              <p className="text-sm text-muted">No sales recorded yet.</p>
            )}
            {stats.topProducts.map(({ product, unitsSold }) => (
              <div key={product.id} className="flex items-center gap-3">
                <div
                  className="h-12 w-12 shrink-0 rounded-2xl"
                  style={{
                    background: `linear-gradient(150deg,${product.gradientFrom},${product.gradientTo})`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{product.name}</div>
                  <div className="text-xs text-muted">{unitsSold} sold</div>
                </div>
                <div className="text-sm font-bold text-brand">{formatCurrency(product.price)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
