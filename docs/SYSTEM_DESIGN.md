# System Design

## Architecture Overview

Lavisk follows a **monolithic Next.js architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 15 App                    │
│                                                      │
│  ┌──────────────────────────────────────────┐       │
│  │           React Server Components        │       │
│  │  (Pages, Layouts, Server Actions)        │       │
│  └──────────────┬───────────────────────────┘       │
│                 │                                    │
│  ┌──────────────▼───────────────────────────┐       │
│  │           Route Handlers (API)           │       │
│  │  /api/products, /api/orders, etc.       │       │
│  └──────────────┬───────────────────────────┘       │
│                 │                                    │
│  ┌──────────────▼───────────────────────────┐       │
│  │           Service Layer (lib/services)    │       │
│  │  ProductService, OrderService, etc.      │       │
│  └──────────────┬───────────────────────────┘       │
│                 │                                    │
│  ┌──────────────┴──────────────────────┐            │
│  │  Supabase    │  Mock Data           │            │
│  │  PostgreSQL  │  (in-memory arrays)  │            │
│  └──────────────┴──────────────────────┘            │
│                                                      │
│  ┌──────────────────────────────────────────┐       │
│  │         Event-Driven Automation          │       │
│  │  EventBus → AutomationRegistry →         │       │
│  │  ActivityLog                             │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Razorpay   │  │   Cloudinary  │  │   Resend   │ │
│  │  (Payment)  │  │  (Images)     │  │   (Email)  │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Design Decisions

### Why Next.js Monolith?
- Single deployable unit (no separate backend)
- Shared TypeScript types between frontend and backend
- Route Handlers eliminate need for Express/FastAPI
- React Server Components reduce client JS

### Why Service Layer?
- Components never touch the database directly
- Mock data fallback enables development without Supabase
- Consistent error handling and validation
- Easy to test

### Why Event-Driven Automation?
- Decouples business operations from side effects
- Enables async processing (emails, cache invalidation)
- Activity log provides audit trail
- Extensible — new automation can be added without modifying services

### Why Provider Pattern for Payments?
- Single interface (`PaymentProvider`) for all payment gateways
- Switch providers via `PAYMENT_PROVIDER` env var
- Stubbed providers ready for implementation

## Data Flow

```
Client Component
    │ react-hook-form + zod validation
    ▼
fetch() → Route Handler
    │
    ▼
Zod input validation
    │
    ▼
Service method (server-only)
    │
    ├── Supabase query (if configured)
    │   └── Return typed result
    │
    └── Mock fallback (if not configured)
        └── Return typed result
    │
    ▼
JSON response ({ success: true, data } | { success: false, error })
    │
    ▼
Client Component updates UI
```

## Security

- Admin routes gated by middleware (HMAC-signed session cookie)
- Admin API routes verify session server-side
- Payment verification done server-side (never trust client)
- Cart pricing always recalculated server-side
- Input validation on both client and server (Zod)
- Service role key never exposed to client
- HTTP-only, secure, same-site cookies for admin session
