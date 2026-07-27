# Changelog

## [1.1.0] — 2026-07-24

### Added
- Event-Driven Automation Framework
  - EventBus — central event dispatcher with publish/subscribe pattern
  - AutomationRegistry — declarative automation rules with conditions, actions, failure strategies
  - ActivityLog — persistent audit trail with Supabase + in-memory fallback
  - Event type definitions for all domain events
  - Module-level initialization guard
- Automation integrations across all services:
  - ProductService: events on create, update, delete, stock decrement + low stock detection
  - OrderService: events on create, payment, status change (including cancellation stock restoration)
  - CouponService: events on create, usage increment
  - ReviewService: events on create, approve, reject
  - ContactService: events on submit
  - CategoryService: events on create, update, delete
- Admin Activity Log page (`/admin/activity`) with full event audit table
- Admin API endpoint `GET /api/admin/activity` for activity log queries
- Activity Log sidebar navigation item
- Testing infrastructure with Vitest
  - 4 test files, 32 unit tests
  - EventBus tests (publish, subscribe, unsubscribe, async, error handling)
  - ActivityLog tests (logging, filtering, metadata, failure entries)
  - Validation tests (all Zod schemas)
  - CartService tests (pricing, shipping, out-of-stock, quantity capping)
- Comprehensive documentation in `docs/` directory:
  - PROJECT_OVERVIEW.md — project vision, tech stack, structure, principles
  - AUTOMATION_ARCHITECTURE.md — event-driven architecture, core components, automation chains
  - EVENT_FLOW.md — full event catalog with flow diagrams
  - BUSINESS_RULES.md — all business rules documented
  - SYSTEM_DESIGN.md — architecture diagram, design decisions, security
  - DATABASE_SCHEMA.md — all tables, columns, indexes, RLS
  - API_REFERENCE.md — all storefront and admin endpoints
  - CHANGELOG.md — version history
  - 17 phase documents covering all development phases

## [1.0.0] — 2026-07-24

### Added
- Complete storefront (Home, Shop, Categories, Product, Cart, Checkout, Order Success, About, Contact, Blog, Search, Wishlist)
- Full admin panel (Dashboard, Products, Orders, Categories, Coupons, Reviews, Banners, Customers, Analytics, Settings)
- Payment integration via Razorpay (Cashfree/Stripe stubbed)
- Email notifications via Resend (order confirmation, admin notification, contact acknowledgement)
- Image upload via Cloudinary
- Admin authentication with HMAC-signed session cookies
- SEO with JSON-LD structured data (Product, Article, FAQPage, BreadcrumbList, ItemList, Organization, WebSite)
- Sitemap generation and robots.txt
- Server-side cart pricing and payment verification
- Zod validation on all API inputs
- Mock data fallback for development without external services
