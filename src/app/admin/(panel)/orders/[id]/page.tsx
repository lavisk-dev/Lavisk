import { notFound } from "next/navigation";
import { OrderEngine } from "@/lib/services/order-engine.service";
import { AdminOrderDetail } from "@/components/admin/orders/admin-order-detail";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await OrderEngine.getOrderDetail(id);
  if (!detail) notFound();

  return <AdminOrderDetail order={detail} />;
}
