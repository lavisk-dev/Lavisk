import { InventoryService } from "@/lib/services/inventory.service";
import { InventoryMovementsTable } from "@/components/admin/inventory/inventory-movements-table";

export default async function AdminInventoryMovementsPage() {
  const { movements, total } = await InventoryService.getMovements({ pageSize: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Inventory Movements</h1>
        <p className="text-sm text-muted">{total} total movements recorded</p>
      </div>

      <InventoryMovementsTable initialMovements={movements} />
    </div>
  );
}