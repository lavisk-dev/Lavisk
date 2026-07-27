import { AdminShippingDashboard } from "@/components/admin/shipping/admin-shipping-dashboard";

export default async function AdminShippingPage() {
  return <AdminShippingDashboard initialShipments={[]} total={0} />;
}