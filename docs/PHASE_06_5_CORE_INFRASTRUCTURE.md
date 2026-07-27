# Phase 06.5 — Core Infrastructure & Platform Foundation

## Objective
Build shared infrastructure modules under `src/lib/core/` that all engines depend on, then refactor existing engines to use them instead of ad‑hoc `process.env` reads or duplicated patterns.

## Modules

### `src/lib/core/event-bus/index.ts`
- `CoreEventBus` — enhanced event bus with standardized `DomainEvent` envelope
- Standard fields: `id`, `type`, `version`, `timestamp`, `correlationId`, `causationId`, `source`, `actor`, `payload`, `metadata`
- `PublishOptions` — metadata that flows through to every event
- Async/sync handler isolation — sync handlers run in‑order, async handlers run with `Promise.allSettled`
- Backward‑compatible wrapper at `src/lib/services/automation/event-bus.ts` that delegates to `CoreEventBus` while preserving the old `(type, payload)` API

### `src/lib/core/logging/index.ts` + `tracer.ts`
- `createLogger()` with structured `LogEntry` — `correlationId`, `engine`, `event`, `entity`, `duration`, `error`
- `child()` for scoped loggers (e.g. `logger.child({ engine: "payment" })`)
- `tracer` — simple span‑based telemetry (`startSpan` / `endSpan` / `withSpan`)

### `src/lib/core/config/index.ts`
- Single `config` object reading all environment variables
- Sections: `app`, `database`, `supabase`, `payment`, `email`, `security`, `storage`, `features`
- No engine reads `process.env` directly after refactor

### `src/lib/core/errors/index.ts`
- `AppError` base class + `ValidationError`, `BusinessRuleError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `PaymentError`, `InventoryError`, `NotificationError`, `ConfigurationError`
- `isAppError()` / `toAppError()` utilities

### `src/lib/core/cache/index.ts`
- `CacheStore` interface with `get`, `set`, `delete`, `clear` (Redis‑ready)
- `createMemoryCache()` with TTL support
- `memoryCache` singleton

### `src/lib/core/providers/index.ts`
- `Provider` interface — `name`, `isConfigured()`
- `ProviderRegistry<T>` — generic registry with `register`, `get`, `getAll`, `getConfigured`
- `createProviderRegistry()` factory

## Refactoring

### Services updated to use `config`
| File | Change |
|---|---|
| `razorpay.service.ts` | `process.env.RAZORPAY_*` → `config.payment.razorpay.*` |
| `resend-provider.ts` | `process.env.RESEND_*` → `config.email.resend.*` |
| `payment/index.ts` | `process.env.PAYMENT_PROVIDER` → `config.payment.provider` |
| `notification/index.ts` | `process.env.RESEND_API_KEY` → `config.email.resend.isConfigured` |
| `api/payment/verify/route.ts` | `process.env.PAYMENT_PROVIDER` → `config.payment.provider` |
| `api/payment/create-order/route.ts` | `process.env.PAYMENT_PROVIDER` → `config.payment.provider` |

### Circular dependency fix
The `AutomationRegistry` previously imported `ProductService`, `CouponService`, and `sendOrderConfirmationEmail` / `sendAdminOrderNotification` at the module level, creating a cycle through `@/lib/services/automation`. All three are now lazy‑loaded with `await import()` inside the action handlers, breaking the cycle.

### EventBus backwards compatibility
The legacy `EventBus` at `src/lib/services/automation/event-bus.ts` now wraps `CoreEventBus`, preserving all existing `EventBus.on()`, `EventBus.publish()`, etc. call sites.

## Verification
- `tsc --noEmit` — passes clean
- `next lint` — no new warnings/errors
- `next build` — full production build succeeds
