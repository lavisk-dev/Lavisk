# Phase 04: Order Engine

## Objective

Build a production-ready Order Engine — the central business engine responsible for managing the complete order lifecycle. Every status change creates timeline entries, publishes domain events, and integrates with the Inventory Engine (never bypassing it).

## Architecture

### Layer Diagram

```
Admin UI (Server Components + Client Components)
    │
    ▼
API Routes (Next.js Route Handlers)
    │
    ▼
OrderEngine (Service Layer)
    │
    ├── OrderService (existing — list, getById, create)
    ├── InventoryService (Phase 03 — stock mutations)
    ├── OrderTimeline (new — status history)
    ├── EventBus (domain events)
    └── ActivityLog (audit trail)
```

### Key Principles

1. **Timeline-first** — Every status change creates an immutable timeline record before anything else.
2. **Inventory via service** — Stock mutations only through `InventoryService.addStock` / `InventoryService.removeStock`.
3. **Event-driven** — Every lifecycle transition publishes a domain event consumed by the automation registry.
4. **Auditable** — Timeline + Activity Log provide full order audit trail.
5. **Non-breaking** — Existing `OrderService` is preserved for backward compatibility.

## Database Schema

### orders (existing)

Already has all required columns. No schema changes needed.

### order_timeline (new table)

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | e.g. "ot_<timestamp>_<rand>" |
| order_id | TEXT | NOT NULL | FK to orders.id |
| status | TEXT | NOT NULL | The new status |
| previous_status | TEXT | NOT NULL | The status before the change |
| note | TEXT | NULLABLE | Optional admin note |
| performed_by | TEXT | NOT NULL | "system", "customer", or admin email |
| created_at | TIMESTAMPTZ | now() | |

**Indexes:**
- `idx_order_timeline_order_id` ON order_timeline(order_id)
- `idx_order_timeline_created_at` ON order_timeline(created_at DESC)

## Status Lifecycle

```
pending ──► paid ──► processing ──► packed ──► dispatched ──► out_for_delivery ──► delivered
  │          │                                                                       │
  │          └──► cancelled ──► refunded                                              │
  └──► cancelled ──► refunded                                                         │
                                                                                     └──► returned
```

### Status Definitions

| Status | Description |
|---|---|
| pending | Order created, awaiting payment |
| paid | Payment confirmed, inventory reserved |
| processing | Being prepared in warehouse |
| packed | Items packed and ready |
| dispatched | Handed to courier |
| out_for_delivery | Last-mile delivery in progress |
| delivered | Successfully delivered |
| cancelled | Order cancelled before/after payment |
| refunded | Amount refunded to customer |
| returned | Customer returned delivered items |

## Order Model

Each order stores:
- Order Number (auto-generated: LAV-YYYY-NNNNNN)
- Customer Information (name, email, phone)
- Shipping Address (full address object)
- Billing Address (full address object — new)
- Items (array of OrderItem)
- Subtotal, Discount, Tax, Shipping Charge, Grand Total
- Payment Method, Payment Status
- Order Status (lifecycle state)
- Timeline (array of timeline entries)
- Coupon Code
- Gift Note
- Created At, Updated At

## API Design

All endpoints require admin authentication.

### GET /api/admin/orders
List orders with pagination and status filter. *(existing)*

### GET /api/admin/orders/[id]
Get order detail with timeline and inventory movements.

### PATCH /api/admin/orders/status
Update order status.

Body:
```json
{
  "orderId": "o_1234",
  "status": "dispatched",
  "note": "Handed to BlueDart, tracking: BD-9876"
}
```

### POST /api/admin/orders/cancel
Cancel an order and restore inventory.

Body:
```json
{
  "orderId": "o_1234",
  "reason": "Customer requested cancellation"
}
```

### POST /api/admin/orders/refund
Refund a cancelled/paid order.

Body:
```json
{
  "orderId": "o_1234",
  "reason": "Processing refund"
}
```

### GET /api/admin/orders/timeline
Get timeline for a specific order.

Query params: `orderId`

## Automation Flow

### Events

| Event | Trigger | Payload |
|---|---|---|
| `order.created` | OrderService.create | orderId, orderNumber, status, customerEmail |
| `order.paid` | Payment verified | orderId, orderNumber, status, items, total |
| `order.updated` | Any status change | orderId, orderNumber, status, previousStatus |
| `order.confirmed` | Status → processing | orderId, orderNumber |
| `order.packed` | Status → packed | orderId, orderNumber |
| `order.dispatched` | Status → dispatched | orderId, orderNumber |
| `order.delivered` | Status → delivered | orderId, orderNumber |
| `order.cancelled` | Status → cancelled | orderId, orderNumber, reason |
| `order.returned` | Status → returned | orderId, orderNumber |
| `order.refunded` | Status → refunded | orderId, orderNumber |

### Event Chain Example

```
Admin updates status to "dispatched"
    │
    ▼
POST /api/admin/orders/status
    │
    ├── OrderEngine.updateStatus
    │   ├── Validate status transition
    │   ├── Create timeline entry (previous_status → dispatched)
    │   ├── Update order.status
    │   ├── Publish ORDER_UPDATED
    │   └── Publish ORDER_DISPATCHED
    │           │
    │           ▼
    │   AutomationRegistry
    │       ├── Log to ActivityLog
    │       └── (future) Email/WhatsApp dispatch notification
    │
    └── Response
```

### Cancellation Flow

```
Admin cancels order
    │
    ▼
POST /api/admin/orders/cancel
    │
    ├── OrderEngine.cancelOrder
    │   ├── Validate order is cancellable
    │   ├── Create timeline entry
    │   ├── Update order.status = "cancelled"
    │   ├── InventoryService.addStock (for each item, operation: "return")
    │   │   └── INVENTORY_UPDATED event
    │   ├── Publish ORDER_CANCELLED
    │   └── Publish ORDER_UPDATED
    │
    └── Response
```

## Business Rules

| Rule | Behavior |
|---|---|
| Order number format | `LAV-{year}-{6-digit sequential}` |
| Status transitions | Forward only (no going back), except cancel anytime before delivered |
| Cancellation | Must restore inventory via InventoryService.addStock |
| Refund | Only after cancellation |
| Timeline | Every status change creates a timeline record |
| Inventory | Never direct stock mutation — always through InventoryService |
| Max items per order | 20 units per line item |
| Pending → Cancelled | No inventory restoration needed (no stock was taken) |
| Paid/Delivered → Cancelled | Must restore inventory |

## Files Changed

### New Files
- `src/lib/services/order-engine.service.ts`
- `src/lib/services/order-timeline.service.ts`
- `src/app/api/admin/orders/[id]/route.ts`
- `src/app/api/admin/orders/status/route.ts`
- `src/app/api/admin/orders/cancel/route.ts`
- `src/app/api/admin/orders/refund/route.ts`
- `src/app/api/admin/orders/timeline/route.ts`
- `src/components/admin/orders/order-timeline.tsx`

### Modified Files
- `src/lib/types/index.ts` — expand OrderStatus, add OrderTimelineEntry, BillingAddress
- `src/lib/services/automation/event-types.ts` — add new order events
- `src/lib/services/automation/automation-registry.ts` — register new rules
- `src/lib/utils/index.ts` — update generateOrderNumber
- `src/components/admin/orders/admin-order-detail.tsx` — add timeline, payment, inventory
- `docs/PHASE_04_ORDER_ENGINE.md` — this file
- `docs/API_REFERENCE.md` — add order endpoints
- `docs/EVENT_FLOW.md` — add order events
- `docs/DATABASE_SCHEMA.md` — add order_timeline table
- `docs/BUSINESS_RULES.md` — update order rules

## Future Improvements

- Partial cancellation (cancel specific items)
- Automated refund via payment provider API
- Order printing / invoice PDF generation
- Bulk status updates
- Order notes (internal)
- Hold/unhold order flow
- Automated dispatch tracking integration
- RTO (Return to Origin) handling