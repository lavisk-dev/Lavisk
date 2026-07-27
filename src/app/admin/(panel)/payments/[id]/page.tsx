import { notFound } from "next/navigation";
import { PaymentEngine } from "@/lib/services/payment-engine.service";
import { AdminPaymentDetail } from "@/components/admin/payments/admin-payment-detail";

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await PaymentEngine.getPaymentDetail(id);
  if (!detail.payment) notFound();

  return <AdminPaymentDetail payment={detail.payment} transactions={detail.transactions} refunds={detail.refunds} />;
}