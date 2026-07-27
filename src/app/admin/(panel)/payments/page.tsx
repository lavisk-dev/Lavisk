import { PaymentEngine } from "@/lib/services/payment-engine.service";
import { AdminPaymentsDashboard } from "@/components/admin/payments/admin-payments-dashboard";

export default async function AdminPaymentsPage() {
  const { payments, total } = await PaymentEngine.listPayments({ pageSize: 200 });
  return <AdminPaymentsDashboard initialPayments={payments} total={total} />;
}