# Automation Architecture

## Overview

Lavisk uses a custom Event-Driven Automation framework. Every business operation generates events that trigger automated workflows. The automation system is built from three core components:

1. **EventBus** — publishes events and notifies subscribers
2. **AutomationRegistry** — maps events to automated actions
3. **ActivityLog** — persists every automation event for audit

## Core Components

### EventBus (`src/lib/services/automation/event-bus.ts`)

Central event dispatcher. Services publish events after completing operations. Subscribers react without blocking the caller.

```typescript
// Publishing
EventBus.publish("product.created", { productId: "p1", name: "The Bloom Box" });

// Subscribing (registered in automation registry)
EventBus.on("product.created", async (event) => {
  await regenerateSitemap();
});
```

### AutomationRegistry (`src/lib/services/automation/automation-registry.ts`)

Declarative mapping of events to automated actions. Each automation entry defines:

| Field | Description |
|---|---|
| `event` | Event name (e.g., `order.placed`) |
| `trigger` | What starts the automation |
| `condition` | Optional predicate that must be true |
| `actions` | Array of actions to execute |
| `notifications` | Optional email/notifications |
| `failure` | Failure handling strategy |

### ActivityLog (`src/lib/services/automation/activity-log.ts`)

Persistent audit trail. Every automation event is logged with:
- Event type
- Entity ID and type
- Actor (system or user)
- Action performed
- Result (success/failure)
- Metadata
- Timestamp

## Event Flow

```
User Action (e.g., "Place Order")
    │
    ▼
Service Method (OrderService.create)
    │
    ├── Perform business logic
    ├── Persist to database
    └── EventBus.publish("order.created")
            │
            ▼
    AutomationRegistry
        │
        ├── Condition met?
        │   └── No → Log skipped
        │
        ├── Execute Action 1: InventoryService.decrementStock
        │   └── EventBus.publish("inventory.decremented")
        │
        ├── Execute Action 2: EmailService.sendConfirmation
        │
        ├── Execute Action 3: CouponService.incrementUsage
        │
        └── ActivityLog.log({ event, action, result })
                │
                ▼
        Admin Panel → Activity Log view
```

## Automation Chains

### Product Created
```
product.created
  → Generate slug
  → Update category product count
  → Invalidate homepage cache
  → Regenerate sitemap
  → Log activity
```

### Order Placed
```
order.placed
  → PaymentService.createOrder
  → (on success) order.paid
      → InventoryService.decrementStock
      → EmailService.sendConfirmation
      → CouponService.incrementUsage (if coupon used)
      → DashboardService.invalidateStats
      → AdminNotification email
      → Log activity
```

### Order Status Changed
```
order.status_changed
  → (if shipped) EmailService.sendShippingNotification
  → (if delivered) EmailService.sendDeliveryConfirmation
  → (if cancelled) InventoryService.restoreStock
  → Log activity
```

### Review Created
```
review.created
  → AdminNotification for moderation
  → (on approval) Update product rating
      → Invalidate product cache
      → Log activity
```

### Contact Submitted
```
contact.submitted
  → EmailService.sendAcknowledgement
  → AdminNotification email
  → Log activity
```

## Failure Handling

Each automation action can have:

- **ignore** — log failure, continue chain
- **retry** — retry up to N times with backoff
- **abort** — stop the entire chain
- **rollback** — undo previous actions in the chain

## Activity Log Schema

```typescript
interface ActivityEntry {
  id: string;
  event: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: "system" | "admin" | "customer";
  result: "success" | "failure" | "skipped";
  metadata?: Record<string, unknown>;
  error?: string;
  createdAt: string;
}
```

The activity log is exposed in the admin panel under Analytics → Activity Log.
