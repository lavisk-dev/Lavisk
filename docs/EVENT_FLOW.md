# Event Flow

## Event Catalog

### Product Events

| Event | Trigger | Subscribers |
|---|---|---|
| `product.created` | ProductService.create | Slug generation, Category count, Cache invalidation, Sitemap regeneration |
| `product.updated` | ProductService.update | Cache invalidation, Sitemap regeneration |
| `product.deleted` | ProductService.remove | Category count, Cache invalidation, Sitemap regeneration |

### Order Events

| Event | Trigger | Subscribers |
|---|---|---|
| `order.created` | OrderService.create | Payment order creation |
| `order.paid` | OrderService.attachPayment | Inventory decrement, Email confirmation, Coupon usage, Admin notification |
| `order.updated` | OrderEngine.updateStatus / cancel / refund | Activity log |
| `order.confirmed` | Status → processing | (future) Email confirmation |
| `order.packed` | Status → packed | (future) Packing notification |
| `order.dispatched` | Status → dispatched | (future) Tracking email |
| `order.delivered` | Status → delivered | (future) Review request |
| `order.cancelled` | OrderEngine.cancelOrder | Inventory restoration, Activity log |
| `order.returned` | Status → returned | (future) Return processing |
| `order.refunded` | OrderEngine.refundOrder | Activity log |
| `order.status_changed` | OrderService.updateStatus | Email notifications, Inventory restoration (if cancelled) |

### Inventory Events

| Event | Trigger | Subscribers |
|---|---|---|
| `inventory.decremented` | ProductService.decrementStock | Dashboard update |
| `inventory.restored` | Order cancellation | Dashboard update |
| `inventory.updated` | InventoryService.addStock / removeStock / adjustStock | Activity log, low stock / out of stock detection |
| `inventory.low_stock` | Stock below threshold | Admin notification |
| `inventory.out_of_stock` | Stock === 0 | Admin notification |

### Activity Log Entry (from InventoryService)

Every `inventory.updated` event logs:
- Action: `Stock increased: purchase_received (20 units)`
- Actor: `admin`
- Metadata: operation, quantity, before/after stock, reason

### Review Events

| Event | Trigger | Subscribers |
|---|---|---|
| `review.created` | ReviewService.create | Admin moderation notification |
| `review.approved` | ReviewService.setApproval | Product rating update |
| `review.rejected` | ReviewService.setApproval | (none) |

### Coupon Events

| Event | Trigger | Subscribers |
|---|---|---|
| `coupon.created` | CouponService.create | (none) |
| `coupon.usage_incremented` | CouponService.incrementUsage | Dashboard update |

### Category Events

| Event | Trigger | Subscribers |
|---|---|---|
| `category.created` | CategoryService.create | Cache invalidation |
| `category.updated` | CategoryService.update | Cache invalidation |
| `category.deleted` | CategoryService.remove | Cache invalidation |

### Contact Events

| Event | Trigger | Subscribers |
|---|---|---|
| `contact.submitted` | ContactService.create | Email acknowledgement, Admin notification |

## Flow Diagrams

### Complete Checkout Flow

```
User submits checkout form
    │
    ▼
GET /api/cart → CartService.price → priced cart
    │
    ▼
POST /api/payment/create-order
    │
    ├── CartService.price (server-side re-price)
    ├── CouponService.validate (if coupon code)
    ├── OrderService.create
    │   └── EventBus: order.created
    ├── PaymentProvider.createOrder (Razorpay)
    │
    ▼
Razorpay Checkout opens in browser
    │
    ▼
User completes payment
    │
    ▼
POST /api/payment/verify
    │
    ├── PaymentProvider.verifyPayment
    ├── OrderService.attachPayment
    │   └── EventBus: order.paid
    │       ├── ProductService.decrementStock
    │       │   └── EventBus: inventory.decremented
    │       ├── EmailService.sendConfirmation
    │       ├── CouponService.incrementUsage (if applicable)
    │       └── EmailService.sendAdminNotification
    │
    ▼
Redirect to /order-success
```

### Admin Order Status Update Flow

```
Admin changes order status
    │
    ▼
PATCH /api/admin/orders/status  (or PUT /api/admin/orders/[id])
    │
    ├── OrderEngine.updateStatus
    │   ├── OrderTimelineService.addEntry (creates timeline record)
    │   ├── OrderService.updateStatus
    │   └── EventBus: order.updated
    │       └── (if dispatched) EventBus: order.dispatched
    │       └── (if delivered) EventBus: order.delivered
    │
    ▼
Response returned to admin
```

### Admin Order Cancellation Flow

```
Admin cancels order
    │
    ▼
POST /api/admin/orders/cancel
    │
    ├── OrderEngine.cancelOrder
    │   ├── Validate order is cancellable
    │   ├── OrderTimelineService.addEntry
    │   ├── OrderService.updateStatus → "cancelled"
    │   ├── InventoryService.addStock (for each item, if not pending)
    │   │   └── EventBus: inventory.updated
    │   └── EventBus: order.cancelled
    │
    ▼
Response returned to admin
```
