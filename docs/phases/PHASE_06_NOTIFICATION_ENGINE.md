# Phase 06 — Notification Engine

## Objective

Build a production-ready Notification Engine responsible for delivering event-driven notifications to customers and administrators via email (primary), with architecture prepared for WhatsApp, SMS, Push, Slack, Telegram, and Teams.

## Architecture

```
Domain Events (EventBus)
    │
    ▼
AutomationRegistry ──► Notification Rules
    │                       │
    │                       ▼
    │               NotificationEngine
    │                   │        │
    │                   ▼        ▼
    │           EmailProvider  Notification DB
    │           ├─ Resend     (notifications table)
    │           └─ Mock       (queue, logs)
    │
    ▼
ActivityLog (audit trail)
```

### Key Principles

1. **Event-driven** — NotificationEngine never scans for work. It reacts to published domain events via AutomationRegistry.
2. **No business logic** — NotificationEngine contains zero Order, Inventory, or Payment logic. It only formats and delivers messages.
3. **Pluggable providers** — `EmailProvider` interface allows swapping Resend for SendGrid, SES, Brevo, etc. without changing the engine.
4. **Dedup** — Each (event, recipient, orderId) tuple is sent at most once per server lifecycle.
5. **Retry** — Failed notifications are retryable up to `maxRetries` (default 3).
6. **Auditable** — Every notification is persisted to the `notifications` table with full status history.

## Provider Design

```typescript
interface EmailProvider {
  name: string;
  send(input: SendEmailInput): Promise<SendEmailResult>;
  isConfigured(): boolean;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface SendEmailResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}
```

### Providers

| Provider | Status | Auto-selected when |
|----------|--------|-------------------|
| Resend | ✅ Live | `RESEND_API_KEY` is set |
| Mock | ✅ Always available | `RESEND_API_KEY` is empty |
| Brevo | 🔲 Placeholder | Future |
| SendGrid | 🔲 Placeholder | Future |
| SES | 🔲 Placeholder | Future |

## Database Schema

### notifications (new table)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | TEXT | PK | e.g. "notif_<timestamp>_<rand>" |
| event | TEXT | NOT NULL | e.g. "order.created", "payment.success" |
| template_type | TEXT | NOT NULL | e.g. "order_confirmation", "admin_low_stock" |
| channel | TEXT | 'email' | email / sms / push / slack / telegram / teams |
| recipient | JSONB | NOT NULL | `{ email, name? }` |
| subject | TEXT | NOT NULL | Email subject line |
| body | TEXT | NOT NULL | Rendered HTML body |
| status | TEXT | 'queued' | queued / sending / sent / failed / retry |
| retry_count | INT | 0 | |
| max_retries | INT | 3 | |
| error | TEXT | NULLABLE | Last error message |
| metadata | JSONB | NULLABLE | orderId, orderNumber, vars |
| sent_at | TIMESTAMPTZ | NULLABLE | |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | |

## Notification Events (9 subscribed)

| Event | Customer Template | Admin Template |
|-------|------------------|----------------|
| `order.created` | ✅ order_confirmation | ✅ admin_new_order |
| `payment.success` | ✅ payment_success | — |
| `payment.failed` | ✅ payment_failed | ✅ admin_payment_failed |
| `order.dispatched` | ✅ order_dispatched | — |
| `order.delivered` | ✅ order_delivered | — |
| `order.cancelled` | ✅ order_cancelled | — |
| `order.refunded` | ✅ refund_processed | ✅ admin_refund_completed |
| `inventory.low_stock` | — | ✅ admin_low_stock |
| `inventory.out_of_stock` | — | ✅ admin_out_of_stock |

## Email Templates (13 total)

### Customer (7)
- **order_confirmation** — Order summary with items table, total, "View your order" button
- **payment_success** — Payment confirmed, order being prepared
- **payment_failed** — Payment failed, retry link
- **order_dispatched** — Dispatched notification
- **order_delivered** — Delivered confirmation
- **refund_processed** — Refund with amount, 5-7 day notice
- **order_cancelled** — Cancellation confirmation

### Admin (6)
- **admin_new_order** — Customer details, items, shipping info
- **admin_payment_failed** — Attention required for failed payment
- **admin_low_stock** — Product name + remaining stock, inventory link
- **admin_out_of_stock** — Product name, inventory link
- **admin_refund_request** — Reason for refund
- **admin_refund_completed** — Refund processed confirmation

### Template Components
All templates share reusable components:
- `header()` — Gradient header with brand + title
- `footer()` — Brand tagline + store link
- `itemsTable()` — Order items with quantity and line totals
- `button()` — Rounded CTA button
- `wrapper()` — Full layout with background, card, header, body, footer

## API Design

### GET /api/admin/notifications
List notifications with filters.

Query params: `status`, `event`, `page`, `pageSize`

### GET /api/admin/notifications/[id]
Get single notification detail + rendered email content.

### POST /api/admin/notifications/retry
Retry a failed notification.

Body: `{ id: string }`

### POST /api/admin/notifications/test-email
Send a test email to verify configuration.

Body: `{ email: string }`

## Automation Rules (added to automation-registry.ts)

```typescript
// 9 new notification rules, each forwarding to NotificationEngine:

registerRule({ event: ORDER_CREATED,    actions: [customer order_confirmation, admin_new_order] })
registerRule({ event: PAYMENT_SUCCESS,  actions: [customer payment_success] })
registerRule({ event: PAYMENT_FAILED,   actions: [customer payment_failed, admin_payment_failed] })
registerRule({ event: ORDER_DISPATCHED, actions: [customer order_dispatched] })
registerRule({ event: ORDER_DELIVERED,  actions: [customer order_delivered] })
registerRule({ event: ORDER_CANCELLED,  actions: [customer order_cancelled] })
registerRule({ event: ORDER_REFUNDED,   actions: [customer refund_processed, admin_refund_completed] })
registerRule({ event: LOW_STOCK,        actions: [admin_low_stock] })
registerRule({ event: OUT_OF_STOCK,     actions: [admin_out_of_stock] })
```

## Business Rules

| Rule | Implementation |
|------|---------------|
| No duplicate notifications | Dedup by (event, recipient email, orderId) — `Set<string>` |
| Log every notification | Persisted to `notifications` table with full payload |
| Track failures | `error` column + `retry_count` increment |
| Allow retries | `POST /api/admin/notifications/retry` resends failed notification |
| Max retry limit | `maxRetries = 3`, checked before retry |
| Non-blocking failures | All notification actions use `onFailure: "ignore"` |
| Provider fallback | `MockProvider` when `RESEND_API_KEY` is not configured |

## Files Changed

### New Files
- `src/lib/services/notification/email-provider.ts` — EmailProvider interface
- `src/lib/services/notification/resend-provider.ts` — Resend implementation
- `src/lib/services/notification/mock-provider.ts` — Dev/fallback provider
- `src/lib/services/notification/index.ts` — Provider registry + getEmailProvider()
- `src/lib/services/notification/templates.ts` — 13 HTML email templates with reusable components
- `src/lib/services/notification-engine.service.ts` — Core engine: send, sendTemplate, list, getById, retry, sendTestEmail
- `src/app/api/admin/notifications/route.ts` — GET list notifications
- `src/app/api/admin/notifications/[id]/route.ts` — GET notification detail
- `src/app/api/admin/notifications/retry/route.ts` — POST retry failed
- `src/app/api/admin/notifications/test-email/route.ts` — POST test email
- `src/app/admin/(panel)/notifications/page.tsx` — Notifications dashboard
- `src/app/admin/(panel)/notifications/[id]/page.tsx` — Notification detail
- `src/components/admin/notifications/admin-notifications-dashboard.tsx` — Client component: status cards, search, filters, table
- `src/components/admin/notifications/admin-notification-detail.tsx` — Client component: detail, email preview, retry, metadata

### Modified Files
- `src/lib/types/index.ts` — Add NotificationRecord, NotificationTemplate, SendNotificationInput, + 5 type unions
- `src/lib/services/automation/automation-registry.ts` — Add 9 notification rules + helper functions
- `src/components/admin/admin-sidebar.tsx` — Add Notifications nav item (Bell icon)

## Verification

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ Zero errors |
| `next lint` | ✅ Zero new warnings (only pre-existing) |
| `next build` | ✅ Successful, 81 pages compiled |
| Notification routes registered | ✅ 4 admin endpoints |
| Notification UI pages | ✅ Dashboard + detail with email preview |
| Automation rules registered | ✅ 9 notification rules + 2 helper functions |
| Sidebar updated | ✅ Notifications in nav |

## Future Improvements

- **Dead letter queue** — After max retries, move to dead letter for manual inspection
- **Template editor** — Admin UI to edit email templates without code deploy
- **Batch sending** — Queue-based processing for high volume
- **SMS/WhatsApp providers** — Twilio, MessageBird, WhatsApp Business API
- **Push notifications** — Firebase Cloud Messaging, Web Push API
- **Slack/Teams** — Webhook-based channel notifications
- **Daily summary** — Scheduled admin email with sales/stats digest
- **Unsubscribe** — One-click unsubscribe link in all marketing emails
- **Open/click tracking** — Track engagement via pixel + link redirect

Do NOT begin Shipping Engine automatically. Wait for approval.
