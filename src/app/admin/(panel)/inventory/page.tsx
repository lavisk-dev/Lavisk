import { InventoryService } from "@/lib/services/inventory.service";
import { InventoryDashboard } from "@/components/admin/inventory/inventory-dashboard";

export default async function AdminInventoryPage() {
  const dashboard = await InventoryService.getDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Inventory</h1>
        <p className="text-sm text-muted">Manage stock levels across all products</p>
      </div>

      <InventoryDashboard dashboard={dashboard} />
    </div>
  );
}