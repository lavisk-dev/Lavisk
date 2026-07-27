# Business Rules

## Shipping

| Rule | Value |
|---|---|
| Free shipping threshold | ₹499 and above |
| Flat shipping fee (below threshold) | ₹99 |
| Shipping fee on empty cart | ₹0 |

## Coupons

| Rule | Behavior |
|---|---|
| Code matching | Case-insensitive |
| Expiration | Coupon is invalid if `expiresAt` is in the past |
| Usage limit | Coupon is invalid if `usedCount >= usageLimit` |
| Minimum order | If `minOrderValue` is set, subtotal must be >= that value |
| Percentage cap | If `maxDiscount` is set, percentage discount is capped |
| Discount floor | Discount cannot exceed the subtotal |
| Single use per checkout | One coupon per order |

## Orders

| Rule | Behavior |
|---|---|
| Order number format | `LAV-{year}-{6-digit sequential}` |
| Status lifecycle | pending → paid → processing → packed → dispatched → out_for_delivery → delivered |
| Cancellation | From pending, paid, processing, or packed. Restores inventory via InventoryService (unless still pending). |
| Refund | Only after cancellation |
| Timeline | Every status change creates an immutable timeline record |
| Inventory | Never direct stock mutation — always through InventoryService |
| Payment attachment | Automatically decrements stock via ProductService.decrementStock (existing flow) |

## Products

| Rule | Behavior |
|---|---|
| Slug generation | Auto-generated from name if not provided |
| Stock | Decremented on paid order, restored on cancellation |
| Max quantity per item | 20 units per line item |
| Visibility | Controlled by `isActive` flag |

## Reviews

| Rule | Behavior |
|---|---|
| Approval required | Reviews are created as unapproved |
| Rating range | 1–5 (integer) |
| Max comment length | 500 characters |
| Public visibility | Only approved reviews shown on storefront |

## Contact Submissions

| Rule | Behavior |
|---|---|
| Auto-acknowledgement | Email sent to submitter |
| Admin notification | Email sent to configured admin address |

## Inventory

| Rule | Behavior |
|---|---|
| Stock floor | Stock can never go below 0 |
| Movement requirement | Every stock change MUST create an inventory_movement record |
| Operation types | added, removed, adjusted, sale, return, damaged, lost, purchase_received |
| Sale operations | quantity is negative (reduces stock) |
| Return operations | quantity is positive (restores stock) |
| Adjustment | Takes a target stock value, calculates delta |
| Immutable history | Movements are never updated or deleted |
| Low stock threshold | 5 units default (configurable per product via inventory_alerts) |
| Out of stock | stock === 0 triggers OUT_OF_STOCK event |
| Performer tracking | Every movement records who performed it |
| Admin operations | addStock, removeStock, adjustStock via API |

## Automation

| Rule | Behavior |
|---|---|
| Event delivery | Fire-and-forget, non-blocking |
| Failure handling | Configurable per action (ignore/retry/abort/rollback) |
| Activity logging | Every automation action is logged |
| Retry policy | 3 attempts with exponential backoff |
