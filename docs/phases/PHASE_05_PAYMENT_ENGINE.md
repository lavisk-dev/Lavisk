# Phase 05: Payment Engine

## Objective

Build a production-ready Payment Engine responsible only for payment processing. It must NOT contain order business logic or directly update inventory. Everything is event-driven. The engine supports multiple providers through a pluggable abstraction.

## Architecture

### Layer Diagram

```
API Routes (/api/payments/*, /api/admin/payments/*)
    │
    ▼
PaymentEngine (Service Layer)
    │
    ├── PaymentProvider (abstraction)
    │   ├── RazorpayService
    │   ├── CODService
    │   └── (future) Stripe, PayPal, Cashfree
    │
    ├── Payment records + transactions
    ├── Webhook audit log
    ├── EventBus (PAYMENT_SUCCESS, PAYMENT_FAILED, etc.)
    └── ActivityLog (audit trail)
```

### Key Principles

1. **Separation of concerns** — Payment Engine handles only payment. Never touches orders or inventory directly.
2. **Event-driven** — Payment success publishes `PAYMENT_SUCCESS`; OrderEngine subscribes to confirm the order.
3. **Pluggable providers** — Every provider implements the same `PaymentProvider` interface. Swap via `PAYMENT_PROVIDER` env var.
4. **Auditable** — Every payment action (create, verify, webhook, refund) is recorded in the audit log.
5. **Webhook security** — Signature verification prevents forged callbacks. Idempotency prevents duplicate processing.

## Database Schema

### payments (new table)

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | e.g. "pay_<timestamp>_<rand>" |
| order_id | TEXT | NOT NULL | FK to orders.id |
| provider | TEXT | NOT NULL | razorpay / cod / stripe / cashfree |
| provider_order_id | TEXT | NULLABLE | Provider's order reference |
| provider_payment_id | TEXT | NULLABLE | Provider's payment reference |
| amount | NUMERIC | NOT NULL | Payment amount |
| currency | TEXT | 'INR' | |
| status | TEXT | 'pending' | pending/authorized/captured/failed/cancelled/refunded/partially_refunded |
| method | TEXT | NULLABLE | upi / card / netbanking / cod / etc. |
| raw_response | JSONB | NULLABLE | Full provider response |
| metadata | JSONB | NULLABLE | Additional data |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | |

### payment_transactions (new table)

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | |
| payment_id | TEXT | NOT NULL | FK to payments.id |
| type | TEXT | NOT NULL | capture / refund / partial_refund |
| amount | NUMERIC | NOT NULL | |
| status | TEXT | NOT NULL | success / failed / pending |
| provider_reference | TEXT | NULLABLE | |
| raw_response | JSONB | NULLABLE | |
| created_at | TIMESTAMPTZ | now() | |

### payment_webhooks (new table)

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | |
| provider | TEXT | NOT NULL | |
| event_type | TEXT | NOT NULL | |
| raw_body | TEXT | NOT NULL | |
| signature | TEXT | NOT NULL | |
| is_valid | BOOLEAN | false | |
| is_processed | BOOLEAN | false | |
| error | TEXT | NULLABLE | |
| created_at | TIMESTAMPTZ | now() | |

### refunds (new table)

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | |
| payment_id | TEXT | NOT NULL | FK to payments.id |
| order_id | TEXT | NOT NULL | FK to orders.id |
| amount | NUMERIC | NOT NULL | |
| reason | TEXT | NOT NULL | |
| status | TEXT | 'pending' | pending / success / failed |
| provider_refund_id | TEXT | NULLABLE | |
| raw_response | JSONB | NULLABLE | |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | |

### payment_audit_logs (new table)

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | |
| payment_id | TEXT | NOT NULL | FK to payments.id |
| action | TEXT | NOT NULL | create / verify / webhook / refund / cancel |
| performed_by | TEXT | NOT NULL | system / admin |
| metadata | JSONB | NULLABLE | |
| created_at | TIMESTAMPTZ | now() | |

**Indexes:**
- `idx_payments_order_id` ON payments(order_id)
- `idx_payments_status` ON payments(status)
- `idx_payment_transactions_payment_id` ON payment_transactions(payment_id)
- `idx_payment_webhooks_created_at` ON payment_webhooks(created_at DESC)
- `idx_refunds_payment_id` ON refunds(payment_id)
- `idx_payment_audit_logs_payment_id` ON payment_audit_logs(payment_id)

## Payment States

```
pending ──► authorized ──► captured ──► refunded
  │                           │
  └──► failed                 └──► partially_refunded
  └──► cancelled
```

## Provider Design

```typescript
interface PaymentProvider {
  name: string;
  createOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<boolean>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  createRefund(input: CreateRefundInput): Promise<CreateRefundResult>;
}
```

### Providers

| Provider | Status |
|---|---|
| Razorpay | Live — full implementation |
| COD | New — manual payment confirm |
| Stripe | Placeholder |
| Cashfree | Placeholder |
| PayPal | Future |

## Business Rules

| Rule | Behavior |
|---|---|
| No inventory | Payment Engine NEVER calls InventoryService |
| No order logic | Payment Engine NEVER calls OrderService internally |
| Event bus only | Payment Engine publishes events; OrderEngine subscribes |
| Webhook security | Every webhook must verify signature before processing |
| Duplicate prevention | Webhook idempotency via payment_webhooks tracking |
| Audit trail | Every payment action logged to payment_audit_logs |
| Refund | Only after payment.status === "captured" |
| COD | Created as "pending", manually confirmed to "captured" |

## Event Flow

### Payment Success Flow

```
POST /api/payments/verify  (or webhook)
    │
    ├── PaymentEngine.verifyPayment
    │   ├── Provider.verifyPayment (signature check)
    │   ├── Create payment record (status: captured)
    │   ├── Create payment_transaction (type: capture)
    │   ├── PaymentEngine.updateOrderPayment (calls OrderEngine)
    │   │   └── OrderEngine receives PAYMENT_SUCCESS via event
    │   │       ├── OrderTimelineService.addEntry
    │   │       ├── OrderService.updateStatus → "paid"
    │   │       └── InventoryService handles stock via automation
    │   ├── Publish PAYMENT_SUCCESS
    │   ├── Log to activity log
    │   └── Log to payment_audit_logs
    │
    └── Response
```

### Webhook Flow

```
POST /api/payments/webhook
    │
    ├── Record raw webhook to payment_webhooks
    ├── Verify signature (provider.verifyWebhookSignature)
    ├── Update webhook.is_valid
    ├── Check idempotency (already processed?)
    ├── Process webhook event
    │   ├── payment.captured → PaymentEngine.verifyPayment
    │   ├── payment.failed → PaymentEngine.handleFailedPayment
    │   └── payment.refunded → PaymentEngine.handleRefundNotification
    ├── Mark webhook as processed
    └── Response
```

## API Design

### POST /api/payments/create
Create a payment for an order.

Body:
```json
{
  "orderId": "o_1234",
  "provider": "razorpay"
}
```

### POST /api/payments/verify
Verify payment after checkout.

Body:
```json
{
  "orderId": "string",
  "razorpayOrderId": "string",
  "razorpayPaymentId": "string",
  "razorpaySignature": "string"
}
```

### POST /api/payments/webhook
Receive provider webhook (signature-verified).

### POST /api/payments/refund
Process a refund.

Body:
```json
{
  "paymentId": "pay_...",
  "amount": 649,
  "reason": "Customer requested refund"
}
```

### GET /api/admin/payments
List payments with filters.

### GET /api/admin/payments/[id]
Get payment detail + transactions + webhooks + refunds.

### GET /api/admin/payments/history
Get audit history for a payment.

Query params: `paymentId`

## Automation

| Event | Trigger | Subscribers |
|---|---|---|
| `payment.created` | PaymentEngine.createPayment | Activity log |
| `payment.pending` | PaymentEngine.createPayment (COD) | Activity log |
| `payment.success` | PaymentEngine.verifyPayment | OrderEngine.confirmOrder, Activity log |
| `payment.failed` | Payment provider callback | OrderEngine.cancelOrder, Activity log |
| `payment.cancelled` | PaymentEngine.cancelPayment | Activity log |
| `payment.refunded` | PaymentEngine.processRefund | OrderEngine.refundOrder, Activity log |
| `payment.captured` | PaymentEngine.verifyPayment | Activity log |
| `payment.webhook_received` | PaymentEngine.handleWebhook | Activity log |

## Files Changed

### New Files
- `src/lib/services/payment-engine.service.ts` — Core PaymentEngine (createPayment, verifyPayment, handleWebhook, processRefund, getPaymentDetail, listPayments, getTransactions, getRefunds, getPaymentByOrderId)
- `src/lib/services/payment/cod.service.ts` — COD provider (mock createOrder, no webhook)
- `src/app/api/admin/payments/route.ts` — GET list payments (admin)
- `src/app/api/admin/payments/[id]/route.ts` — GET payment detail (admin)
- `src/app/api/admin/payments/history/route.ts` — GET payment history (admin)
- `src/app/api/admin/payments/audit/route.ts` — GET payment audit logs (admin)
- `src/app/api/admin/payments/refund/route.ts` — POST process refund (admin)
- `src/app/api/admin/payments/retry/route.ts` — POST retry failed payment (admin)
- `src/app/admin/(panel)/payments/page.tsx` — Payments dashboard page
- `src/app/admin/(panel)/payments/[id]/page.tsx` — Payment detail page
- `src/components/admin/payments/admin-payments-dashboard.tsx` — Client component: search, filter, status cards, table
- `src/components/admin/payments/admin-payment-detail.tsx` — Client component: payment info, transactions, refunds, actions
- `src/components/admin/payment-status-badge.tsx` — Badge component for payment status

### Modified Files
- `src/lib/types/index.ts` — Add PaymentStatus, PaymentRecord, PaymentTransaction, PaymentWebhook, RefundRecord
- `src/lib/services/automation/event-types.ts` — Add PAYMENT_CREATED through PAYMENT_WEBHOOK_RECEIVED events + PaymentEventPayload
- `src/lib/services/automation/automation-registry.ts` — Register 8 payment automation rules (log, analytics, notification placeholders)
- `src/lib/services/automation/index.ts` — Export PaymentEventPayload type
- `src/lib/services/payment/payment-provider.ts` — Add CreateRefundInput, CreateRefundResult, createRefund method to interface
- `src/lib/services/payment/razorpay.service.ts` — Implement createRefund via Razorpay SDK
- `src/lib/services/payment/index.ts` — Register COD provider in registry
- `src/app/api/payment/create-order/route.ts` — Delegate payment creation to PaymentEngine; keep order creation
- `src/app/api/payment/verify/route.ts` — Delegate to PaymentEngine.verifyPayment; return orderNumber
- `src/app/api/webhooks/razorpay/route.ts` — Delegate to PaymentEngine.handleWebhook
- `src/components/admin/admin-sidebar.tsx` — Add Payments nav item with CreditCard icon

## Verification

- `tsc --noEmit` — zero errors
- `next build` — successful, all payment routes compiled
- `next lint` — zero new warnings

## Future Improvements

- Partial refund UI
- Stripe / PayPal / Cashfree full implementations
- Payment retry UI for failed payments
- Automated refund via payment provider API
- Payment analytics dashboard
- Subscription / recurring payment support
- Multi-currency support
- Payment method analytics