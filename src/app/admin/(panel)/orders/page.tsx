import { OrderService } from "@/lib/services/order.service";
import { AdminOrdersTable } from "@/components/admin/orders/admin-orders-table";

export default async function AdminOrdersPage() {
  const { orders } = await OrderService.list({ pageSize: 200 });
  return <AdminOrdersTable initialOrders={orders} />;
}
