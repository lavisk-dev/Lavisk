# Phase 07 — Shipping & Fulfillment Engine

## Objective
Build a production-ready Shipping & Fulfillment Engine that owns everything after an order is paid until it is delivered. Modular, provider-based, and event-driven. No shipping logic inside OrderEngine.

---

## Architecture

```
src/lib/engines/shipping/
├── shipping-engine.service.ts   # Orchestrator
├── shipment.service.ts          # CRUD for shipments
├── tracking.service.ts          # Tracking events
├── pickup.service.ts            # Pickup requests
├── label.service.ts             # Shipping labels
├── providers/
│   ├── index.ts                 # Provider registry & factory
│   ├── shiprocket.ts            # Primary provider
│   ├── mock.ts                  # Dev/test provider
│   ├── delhivery.ts             # Placeholder
│   ├── bluedart.ts              # Placeholder
│   ├── dtdc.ts                  # Placeholder
│   └── indiapost.ts             # Placeholder
├── types.ts                     # Provider contracts
├── validators.ts                # Input validation
├── events.ts                    # Event publishers (logging only)
├── handlers.ts                  # EventBus subscribers (ORDER_DISPATCHED, etc.)
└── index.ts                     # Barrel export
```

---

## Database Tables (Supabase)

### shipments
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | `shp_<timestamp>_<random>` |
| order_id | TEXT | FK → orders.id |
| tracking_number | TEXT NULLABLE | |
| courier | TEXT | "shiprocket", "delhivery", etc. |
| provider | TEXT | Provider name |
| weight | NUMERIC NULLABLE | |
| length, width, height | NUMERIC NULLABLE | |
| dimension_unit | TEXT | "cm" |
| status | TEXT | pending, label_generated, pickup_scheduled, picked_up, in_transit, out_for_delivery, delivered, delivery_failed, returned, lost, damaged, cancelled |
| pickup_status | TEXT | pending, scheduled, completed, cancelled |
| pickup_scheduled_at | TIMESTAMPTZ NULLABLE | |
| picked_up_at | TIMESTAMPTZ NULLABLE | |
| delivered_at | TIMESTAMPTZ NULLABLE | |
| estimated_delivery | TIMESTAMPTZ NULLABLE | |
| label_url, label_format, packing_slip_url, invoice_url | TEXT NULLABLE | |
| qr_code, barcode | TEXT NULLABLE | |
| shipping_cost | NUMERIC NULLABLE | |
| is_return | BOOLEAN | |
| return_reason | TEXT NULLABLE | |
| notes | TEXT NULLABLE | |
| created_at, updated_at | TIMESTAMPTZ | |

### shipment_items
| Column | Type |
|--------|------|
| id | TEXT PK |
| shipment_id | TEXT FK |
| product_id | TEXT |
| name | TEXT |
| quantity | INTEGER |

### tracking_events
| Column | Type |
|--------|------|
| id | TEXT PK |
| shipment_id | TEXT FK |
| status | TEXT |
| location | TEXT NULLABLE |
| description | TEXT NULLABLE |
| courier_update | TEXT NULLABLE |
| created_at | TIMESTAMPTZ |

### shipping_labels
| Column | Type |
|--------|------|
| id | TEXT PK |
| shipment_id | TEXT FK |
| format | TEXT |
| url | TEXT NULLABLE |
| size | TEXT |
| created_at | TIMESTAMPTZ |

### pickup_requests
| Column | Type |
|--------|------|
| id | TEXT PK |
| shipment_id | TEXT FK |
| status | TEXT |
| scheduled_at | TIMESTAMPTZ NULLABLE |
| pickup_address | TEXT NULLABLE |
| pickup_time | TEXT NULLABLE |
| cancelled_at | TIMESTAMPTZ NULLABLE |
| retry_count | INTEGER |
| notes | TEXT NULLABLE |
| created_at, updated_at | TIMESTAMPTZ |

### shipping_providers
| Column | Type |
|--------|------|
| id | TEXT PK |
| name | TEXT |
| is_active | BOOLEAN |
| api_key, api_secret | TEXT NULLABLE |
| settings | JSONB NULLABLE |
| created_at | TIMESTAMPTZ |

### shipping_audit_logs
| Column | Type |
|--------|------|
| id | TEXT PK |
| shipment_id | TEXT FK |
| action | TEXT |
| old_status, new_status | TEXT NULLABLE |
| performed_by | TEXT |
| metadata | JSONB NULLABLE |
| created_at | TIMESTAMPTZ |

---

## Provider System

### Interface (`types.ts`)

```typescript
interface ShippingProvider {
  name: string;
  isConfigured(): boolean;
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  generateLabel(input: GenerateLabelInput): Promise<GenerateLabelResult>;
  schedulePickup(input: SchedulePickupInput): Promise<SchedulePickupResult>;
  cancelPickup(input: CancelPickupInput): Promise<CancelPickupResult>;
  trackShipment(trackingNumber: string): Promise<TrackShipmentResult>;
  cancelShipment(trackingNumber: string): Promise<CancelShipmentResult>;
  getShippingRate(input: ShippingRateInput): Promise<ShippingRateResult>;
}
```

### Implemented Providers

| Provider | Status | Config |
|----------|--------|--------|
| **Shiprocket** | Primary | `SHIPROCKET_API_KEY`, `SHIPROCKET_API_SECRET`, `SHIPROCKET_API_URL` |
| **Mock** | Dev/Test | Always configured |
| **Delhivery** | Placeholder | `DELHIVERY_API_KEY` |
| **Blue Dart** | Placeholder | `BLUEDART_API_KEY` |
| **DTDC** | Placeholder | `DTDC_API_KEY` |
| **India Post** | Placeholder | `INDIA_POST_API_KEY` |

Selection via `SHIPPING_PROVIDER` env var (default: "mock").

---

## Shipment Lifecycle

```
ORDER_DISPATCHED
    ↓
ShippingEngine.createFromOrder()
    ↓
Shipment Created (status: pending)
    ↓
Provider.createShipment() → trackingNumber, labelUrl
    ↓
Status: label_generated
    ↓
LABEL_GENERATED event
    ↓
schedulePickup()
    ↓
PICKUP_SCHEDULED event
    ↓
Provider picks up → markPickedUp()
    ↓
PICKUP_COMPLETED event
    ↓
Status: picked_up
    ↓
Poll / Webhook → updateTracking()
    ↓
in_transit → out_for_delivery → delivered
    ↓
DELIVERED / DELIVERY_FAILED / RETURN_TO_ORIGIN events
```

### Alternative Flows
- **Delivery Failed** → retry / return to origin
- **Cancelled** → cancel shipment, restore inventory
- **Return** → create return shipment (isReturn: true)

---

## Shipping Events (Published)

| Event | Payload |
|-------|---------|
| `shipment.created` | orderId, trackingNumber, courier, status |
| `shipment.label_generated` | trackingNumber, labelUrl |
| `shipment.pickup_scheduled` | pickupScheduledAt |
| `shipment.pickup_completed` | pickedUpAt |
| `shipment.in_transit` | estimatedDelivery |
| `shipment.out_for_delivery` | |
| `shipment.delivered` | deliveredAt |
| `shipment.delivery_failed` | reason |
| `shipment.return_to_origin` | |
| `shipment.cancelled` | |

*Currently logged via `publishEvent()` (not dispatched to EventBus to avoid circular dependency).*

---

## Event Subscriptions

| Event | Handler |
|-------|---------|
| `ORDER_DISPATCHED` | `ShippingEngine.createFromOrder()` |
| `ORDER_CANCELLED` | `ShippingEngine.cancelForOrder()` |
| `ORDER_RETURNED` | `ShippingEngine.createReturnShipment()` |

Registered in `handlers.ts` via dynamic imports.

---

## Label Generation

- **PDF shipping label** via provider
- **Packing slip** (order details + items)
- **Invoice attachment** (optional)
- **QR Code** (tracking URL)
- **Barcode** (Code128 tracking number)

---

## Tracking Service

```typescript
TrackingService.addEvent(shipmentId, status, location?, description?, courierUpdate?)
TrackingService.getByShipmentId(shipmentId): TrackingEvent[]
TrackingService.getLatestStatus(shipmentId): string | null
```

---

## Pickup Service

```typescript
PickupService.create({ shipmentId, scheduledAt, pickupAddress, pickupTime })
PickupService.getByShipmentId(shipmentId)
PickupService.update(id, updates)
PickupService.list({ pageSize, page, status })
```

---

## Admin Panel

### Routes
- `/admin/shipping` — Dashboard + Shipments list
- `/admin/shipping/[id]` — Shipment detail

### Dashboard Columns
Shipment ID, Order ID, Tracking, Courier, Status, Pickup, Created

### Detail View
- Shipment info (order, tracking, courier, provider, status, pickup)
- Dimensions & labels
- Pickup request
- Timeline (tracking events with visual line)

### API Endpoints
| Method | Path | Action |
|--------|------|--------|
| GET | `/api/admin/shipping` | List shipments (filters: status, courier) |
| GET | `/api/admin/shipping/[id]` | Get detail (shipment, tracking, labels, pickup) |
| POST | `/api/admin/shipping/create?action=create` | Create shipment |
| POST | `/api/admin/shipping/create?action=label` | Generate label |
| POST | `/api/admin/shipping/create?action=pickup` | Schedule pickup |
| POST | `/api/admin/shipping/create?action=cancel` | Cancel shipment |
| POST | `/api/admin/shipping/create?action=update-status` | Update tracking |
| POST | `/api/admin/shipping/create?action=mark-picked-up` | Mark picked up |
| GET | `/api/admin/shipping/tracking?shipmentId=` | Get tracking events |

---

## Automation Flow

```
ORDER_DISPATCHED
    ↓
AutomationRegistry → registerRule(ORDER_DISPATCHED)
    ↓
Handler: ShippingEngine.createFromOrder()
    ↓
Shipment + Label + Pickup scheduled
    ↓
Events: SHIPMENT_CREATED, LABEL_GENERATED, PICKUP_SCHEDULED
    ↓
Notification Engine → Customer email (tracking)
    ↓
Activity Log
```

---

## Core Infrastructure Usage

| Module | Usage |
|--------|-------|
| `CoreEventBus` | (Logging only) |
| `Logger` | All services |
| `Config` | Provider credentials via `config.get()` |
| `AppError` / specific errors | Validation, NotFound, BusinessRule |
| `MemoryCache` | (Future: cache rates) |
| `ProviderRegistry` | Provider selection |

---

## Files Changed

### New
- `src/lib/types/index.ts` (+Shipping types)
- `src/lib/services/automation/event-types.ts` (+Shipping events)
- `src/lib/engines/shipping/` (entire module)
- `src/app/api/admin/shipping/` (4 routes)
- `src/app/admin/(panel)/shipping/` (2 pages)
- `src/components/admin/shipping/` (3 components)

### Modified
- `src/components/admin/admin-sidebar.tsx` (+ Shipping nav)
- `src/lib/services/automation/init.ts` (no change — handlers self-register)

---

## Verification

```bash
npx tsc --noEmit      # ✓ passes
npx next lint         # ✓ passes (pre-existing warnings only)
npx next build        # ✓ succeeds
```

---

## Future Improvements

1. **EventBus Integration** — Re-enable `EventBus.publish()` once circular dep resolved
2. **Rate Shopping** — Multi-carrier rate comparison in `getShippingRate()`
3. **Webhook Handlers** — Provider webhooks → `TrackingService.addEvent()`
4. **Bulk Operations** — CSV import/export, bulk label print
5. **International Shipping** — Customs forms, HS codes
6. **Returns Portal** — Customer-initiated returns with prepaid labels
7. **Analytics** — Delivery time, carrier performance, cost tracking