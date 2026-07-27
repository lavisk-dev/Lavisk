# Phase 03: Inventory Engine

## Objective

Build a professional Inventory Management Engine similar to ERP systems. Never directly edit stock — all stock changes must happen through inventory transactions (movements). Every business action triggers an event for the automation system.

## Architecture

### Layer Diagram

```
Admin UI (Server Components + Client Components)
    │
    ▼
API Routes (Next.js Route Handlers)
    │
    ▼
InventoryService (Service Layer)
    │
    ├── validate operation (Zod)
    ├── execute transaction
    │   ├── Update products.stock
    │   └── INSERT inventory_movements record
    ├── publish DomainEvent
    │   ├── INVENTORY_UPDATED
    │   ├── LOW_STOCK (if stock ≤ threshold)
    │   └── OUT_OF_STOCK (if stock === 0)
    └── return result
```

### Key Principles

1. **Immutability** — Inventory movements are append-only. Once written, they are never modified or deleted.
2. **Transactional** — Stock update and movement creation happen atomically (sequential within a single request).
3. **Auditable** — Every stock change records who, what, why, before, and after.
4. **Event-driven** — Each mutation publishes domain events consumed by the automation registry.
5. **Safety** — Negative inventory is mathematically prevented. Stock always equals `SUM(movements)`.

## Database Schema

### Products Table (existing — extended stock tracking)

Already has `stock INTEGER` column. No schema changes needed.

### inventory_movements (new table)

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | e.g. "im_<timestamp>_<rand>" |
| product_id | TEXT | NOT NULL | FK to products.id |
| operation | TEXT | NOT NULL | added/removed/adjusted/sale/return/damaged/lost/purchase_received |
| quantity | INTEGER | NOT NULL | Positive for additions, negative for removals |
| stock_before | INTEGER | NOT NULL | Snapshot before change |
| stock_after | INTEGER | NOT NULL | Snapshot after change |
| reason | TEXT | NOT NULL | Human-readable reason |
| reference | TEXT | NULLABLE | Order ID, PO number, etc. |
| performed_by | TEXT | NOT NULL | admin@example.com or "system" |
| notes | TEXT | NULLABLE | Optional additional context |
| supplier | TEXT | NULLABLE | Supplier name for purchase_received |
| created_at | TIMESTAMPTZ | now() | Immutable timestamp |

**Indexes:**
- `idx_inventory_movements_product_id` ON inventory_movements(product_id)
- `idx_inventory_movements_operation` ON inventory_movements(operation)
- `idx_inventory_movements_created_at` ON inventory_movements(created_at DESC)

### inventory_alerts (new table)

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | e.g. "ia_<timestamp>_<rand>" |
| product_id | TEXT | NOT NULL, UNIQUE | FK to products.id |
| min_stock | INTEGER | 5 | Alert threshold |
| is_active | BOOLEAN | true | |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | |

## Business Rules

| Rule | Behavior |
|---|---|
| Stock floor | Stock can never go below 0 |
| Movement requirement | Every stock change MUST create an inventory_movement record |
| Operation types | added, removed, adjusted, sale, return, damaged, lost, purchase_received |
| Sale operations | quantity is negative (reduces stock) |
| Return operations | quantity is positive (restores stock) |
| Removed operations | quantity is positive (but reduces stock — manually removed) |
| Adjustment | Takes a target stock value, calculates delta |
| Immutable history | Movements are never updated or deleted |
| Low stock threshold | ≤ 5 units (configurable per product via inventory_alerts) |
| Out of stock | stock === 0 triggers OUT_OF_STOCK event |
| Performer tracking | Every movement records who performed it |

## API Design

### Endpoints

All endpoints require admin authentication.

#### GET /api/admin/inventory
Returns inventory dashboard data (current stock levels, low stock count, recent movements).

Response:
```json
{
  "success": true,
  "data": {
    "totalProducts": 42,
    "lowStockCount": 3,
    "outOfStockCount": 1,
    "recentMovements": [...],
    "stockSummary": [...]
  }
}
```

#### GET /api/admin/inventory/movements
Paginated list of all inventory movements.

Query params: `productId`, `operation`, `page`, `pageSize`

#### POST /api/admin/inventory/add-stock
Add stock to a product.

Body:
```json
{
  "productId": "p1",
  "quantity": 10,
  "reason": "Purchase received",
  "reference": "PO-001",
  "notes": "Supplier ABC",
  "supplier": "ABC Corp"
}
```

#### POST /api/admin/inventory/remove-stock
Remove stock from a product.

Body:
```json
{
  "productId": "p1",
  "quantity": 5,
  "reason": "Damaged in warehouse",
  "notes": "Water damage"
}
```

#### POST /api/admin/inventory/adjust-stock
Set stock to an exact value.

Body:
```json
{
  "productId": "p1",
  "newStock": 25,
  "reason": "Physical count adjustment",
  "notes": "Counted physically, found discrepancy"
}
```

#### GET /api/admin/inventory/low-stock
Returns products with stock at or below their alert threshold.

#### GET /api/admin/inventory/product/[productId]
Returns inventory details and movement history for a specific product.

## Automation Flow

### Events

New event types added:

| Event | Trigger | Payload |
|---|---|---|
| `inventory.updated` | Any stock change | productId, operation, quantity, stockBefore, stockAfter |
| `inventory.out_of_stock` | stockAfter === 0 | productId, productName, lastOperation |

### Existing events (updated)

| Event | Trigger | Subscribers |
|---|---|---|
| `inventory.decremented` | Sale via order.paid | Dashboard update |
| `inventory.restored` | Order cancelled | Dashboard update |
| `inventory.low_stock` | stockAfter ≤ threshold | Admin notification |
| `inventory.out_of_stock` | stockAfter === 0 | Admin notification |

### Event Chain Example

```
POST /api/admin/inventory/add-stock
    │
    ├── InventoryService.addStock
    │   ├── Fetch current stock
    │   ├── Calculate new stock (current + quantity)
    │   ├── Validate (new stock >= 0)
    │   ├── UPDATE products SET stock = newStock
    │   ├── INSERT inventory_movements (before, after, operation, reason, ...)
    │   └── EventBus.publish(INVENTORY_UPDATED)
    │           │
    │           ▼
    │   AutomationRegistry
    │       ├── Check low stock → EventBus.publish(INVENTORY_LOW_STOCK)
    │       └── Check out of stock → EventBus.publish(OUT_OF_STOCK)
    │
    └── Response
```

## Implementation Plan

### Step 1: Types
- Add `InventoryOperation`, `InventoryMovement`, `InventoryAlert` to `src/lib/types/index.ts`

### Step 2: Events
- Add `INVENTORY_UPDATED` and `OUT_OF_STOCK` to `EventTypes`
- Add `InventoryUpdatedPayload` event payload type

### Step 3: Service
- Create `src/lib/services/inventory.service.ts`
- Methods: `getMovements`, `addStock`, `removeStock`, `adjustStock`, `getLowStock`, `getProductInventory`, `getDashboard`
- Always create movement records
- Always publish events

### Step 4: Validation
- Add Zod schemas for add/remove/adjust operations in `src/lib/utils/validation.ts`

### Step 5: API Routes
- Create `src/app/api/admin/inventory/` route group
- Route files for each operation

### Step 6: Automation
- Register rules for `INVENTORY_UPDATED` → check low stock / out of stock
- Register rule for `OUT_OF_STOCK` → log

### Step 7: Admin UI
- Create `/admin/inventory` page (dashboard)
- Create `/admin/inventory/movements` page (full history)
- Create client components for stock actions (modals)
- Add sidebar navigation

### Step 8: Documentation
- Update `docs/PHASE_03_INVENTORY.md`
- Update `docs/API_REFERENCE.md`
- Update `docs/EVENT_FLOW.md`
- Update `docs/DATABASE_SCHEMA.md`
- Update `docs/BUSINESS_RULES.md`

## Files Changed

### New Files
- `src/lib/services/inventory.service.ts`
- `src/app/api/admin/inventory/route.ts`
- `src/app/api/admin/inventory/movements/route.ts`
- `src/app/api/admin/inventory/low-stock/route.ts`
- `src/app/api/admin/inventory/add-stock/route.ts`
- `src/app/api/admin/inventory/remove-stock/route.ts`
- `src/app/api/admin/inventory/adjust-stock/route.ts`
- `src/app/api/admin/inventory/product/[productId]/route.ts`
- `src/app/admin/(panel)/inventory/page.tsx`
- `src/app/admin/(panel)/inventory/movements/page.tsx`
- `src/components/admin/inventory/inventory-dashboard.tsx`
- `src/components/admin/inventory/inventory-movements-table.tsx`
- `src/components/admin/inventory/add-stock-modal.tsx`
- `src/components/admin/inventory/remove-stock-modal.tsx`
- `src/components/admin/inventory/adjust-stock-modal.tsx`

### Modified Files
- `src/lib/types/index.ts` — add inventory types
- `src/lib/services/automation/event-types.ts` — add new events
- `src/lib/services/automation/automation-registry.ts` — register new rules
- `src/lib/utils/validation.ts` — add inventory schemas
- `src/components/admin/admin-sidebar.tsx` — add Inventory nav item
- `docs/PHASE_03_INVENTORY.md` — this file (updated)
- `docs/API_REFERENCE.md` — add inventory endpoints
- `docs/EVENT_FLOW.md` — add inventory events
- `docs/DATABASE_SCHEMA.md` — add new tables
- `docs/BUSINESS_RULES.md` — update inventory rules

## Remaining Tasks

After implementation:
1. Verify all API endpoints return correct data
2. Verify event publishing works for all operations
3. Verify negative inventory prevention
4. Test admin UI workflows (add, remove, adjust)
5. Run `npm run lint` and `npm run typecheck`
6. Document any issues found

## Future Improvements

- Batch inventory import (CSV upload)
- Inventory valuation (FIFO / weighted average cost)
- Stock transfer between warehouses
- Barcode / SKU scanning
- Inventory forecasting
- Automated reorder suggestions
- Supplier management
- Purchase order management