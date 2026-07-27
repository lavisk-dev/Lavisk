# Lavisk Engineering Audit

## Executive Summary

**Lavisk** is a premium DTC gift e-commerce platform built with Next.js 15 (App Router), TypeScript, Tailwind CSS, Radix UI, Framer Motion, Zustand, Supabase, Razorpay, Cloudinary, and Resend.

| Dimension | Assessment |
|---|---|
| **Maturity** | High — 101 pages, 81 components, 69 lib modules, 17 phase docs |
| **Overall Completion** | ~80% |
| **Architecture** | Strong — layered monolith with service abstraction, event bus, mock fallbacks |
| **Design** | Excellent — pixel-perfect luxury aesthetic, cohesive palette, rich animations |
| **Code Quality** | Good — consistent patterns, TypeScript strict, server-only boundaries |
| **Launch Readiness** | Not yet — accessibility gap, no customer auth, test coverage too low, performance issues |

---

## Current Architecture

### Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS 3.4 + `tailwindcss-animate` |
| **UI Primitives** | Radix UI (12 primitives) + shadcn/ui-style wrappers |
| **Animation** | Framer Motion 11 + CSS keyframes (16 custom) |
| **State** | Zustand 5 with `persist` middleware |
| **Database** | Supabase PostgreSQL (with in-memory mock fallback) |
| **Payment** | Razorpay (working) + Cashfree/Stripe stubs |
| **Email** | Resend |
| **Image Hosting** | Cloudinary |
| **Validation** | Zod + React Hook Form |
| **Auth** | HMAC SHA-256 session cookies (admin only) |

### Architecture Pattern

```
Next.js 15 App Router
├── Server Components (pages, layouts)
├── Client Components (interactivity)
├── Route Handlers (API: /api/*)
│   └── Zod input validation → Service Layer
└── Middleware (admin auth gate)

Service Layer (lib/services/)
├── Domain Services (Product, Order, Cart, Coupon, etc.)
├── Automation (EventBus + AutomationRegistry + ActivityLog)
├── Payment Providers (Razorpay, Cashfree stub, Stripe stub, COD)
├── Email (Resend + mock)
├── Notification Engine
└── Shipping Engine (Shiprocket + 4 stubs + mock)

Data Access
├── Supabase (when configured)
└── In-memory arrays (mock fallback)

State (Zustand)
├── Cart (localStorage-persisted)
├── Wishlist (localStorage-persisted)
└── UI (mobile nav, quick-view)
```

### Key Architectural Decisions

1. **Monolithic Next.js** — single deployable unit, shared types, no separate backend
2. **Service layer** — components never touch DB directly; mock fallback enables development without services
3. **Event-driven automation** — in-process EventBus with 40+ event types, automation rules, activity log
4. **Provider pattern** — single interface for payments and shipping; switch via env var
5. **Mock-first development** — every service checks env config and falls back to seed data

---

## Existing Features

| Feature | Status | Notes |
|---|---|---|
| **Storefront** | | |
| Home Page | ✅ Complete | Hero carousel, categories, trending marquee, bestsellers, journal, why-us |
| Navigation | ✅ Complete | Fixed navbar with scroll-reveal, mobile drawer, cart drawer |
| Shop / Listing | ✅ Complete | Filters by category, sort, search params |
| Product Detail | ✅ Complete | Images, quantity, reviews, related products |
| Cart (Drawer) | ✅ Complete | Slide-out sheet with quantity controls, empty state |
| Wishlist | ✅ Complete | Heart toggle, persisted to localStorage |
| Checkout | ✅ Complete | RHF + Zod, Razorpay, coupon support |
| Order Success | ✅ Complete | Post-purchase confirmation |
| Categories | ✅ Complete | Grid + per-category pages |
| Search | ✅ Complete | Debounced via URL params |
| About | ✅ Complete | Static page |
| Contact | ✅ Complete | Form + email notification |
| Blog | ✅ Complete | 6 mock posts, article renderer, FAQ support |
| **Admin Panel** | | |
| Dashboard | ✅ Complete | Stats cards + recent orders |
| Products CRUD | ✅ Complete | List, create, edit |
| Categories CRUD | ✅ Complete | |
| Orders | 🟡 Partial | List + status update; detail view is minimal |
| Customers | 🟡 Partial | List only |
| Coupons | ✅ Complete | CRUD |
| Reviews | ✅ Complete | List, approve/reject |
| Banners | ✅ Complete | CRUD |
| Analytics | ✅ Complete | Revenue by category, status funnel |
| Settings | ✅ Complete | Integration status + store details |
| Inventory | ✅ Complete | Dashboard, movements, stock ops |
| Notifications | ✅ Complete | List, detail, retry, test email |
| Shipping | 🟡 Partial | Dashboard + detail rendered |
| Payments | ✅ Complete | List, detail, refund, retry, audit, history |
| Activity Log | ✅ Complete | Full event audit table |
| **Payments** | | |
| Razorpay | ✅ Complete | Full integration + webhooks |
| Cashfree | ❌ Missing | Stub only |
| Stripe | ❌ Missing | Stub only |
| COD | ✅ Complete | Cash on delivery |
| **Shipping** | | |
| Shiprocket | ✅ Complete | JWT auth, full implementation |
| Bluedart | ❌ Missing | Stub |
| Delhivery | ❌ Missing | Stub |
| DTDC | ❌ Missing | Stub |
| India Post | ❌ Missing | Stub |
| **Infrastructure** | | |
| Admin Auth | ✅ Complete | HMAC-signed session cookies |
| Customer Auth | ❌ Missing | No customer accounts |
| Cloudinary | ✅ Complete | Upload + delete |
| SEO (JSON-LD) | ✅ Complete | 10+ schema types |
| Sitemap | ✅ Complete | Dynamic generation |
| robots.txt | ✅ Complete | |
| ai.txt / llms.txt | ✅ Complete | For AI crawlers |
| **Testing** | | |
| Unit Tests | 🟡 Partial | 32 tests in 4 files |
| E2E Tests | ❌ Missing | |
| **Other** | | |
| i18n | ❌ Missing | |
| PWA | ❌ Missing | |
| CI/CD | ❌ Missing | |
| Dark Mode | ❌ Missing | Config present, no palette |
| Error Boundaries | ❌ Missing | No `error.tsx` anywhere |
| Loading UI | 🟡 Partial | Skeleton on home page only |

---

## Missing Features

| Feature | Impact | Priority |
|---|---|---|
| **Customer Authentication** | No accounts, no order history, no retention, no saved addresses | P0 |
| **Error Boundaries** | Any server error → white screen | P0 |
| **Accessibility (WCAG AA)** | Legal liability, excludes users | P0 |
| **Order History (Customer)** | Customers can't view past orders after checkout | P1 |
| **E2E Tests** | No automated regression safety net | P1 |
| **CI/CD Pipeline** | No automated build/test/deploy | P1 |
| **Loading UI** | Only homepage has skeletons | P1 |
| **Lazy Loading Images** | Product detail, admin list pages | P1 |
| **Cashfree / Stripe** | Only Razorpay works | P2 |
| **Bluedart / Delhivery / DTDC / India Post** | Only Shiprocket works | P2 |
| **Dark Mode** | Config exists, no implementation | P2 |
| **i18n** | English only | P3 |
| **PWA** | No offline, no install prompt | P3 |
| **Analytics Integration** | GA / Plausible / etc. | P3 |

---

## Performance Review

### Score: 52/100

### Critical Issues

| Issue | File | Severity |
|---|---|---|
| AmbientBackground renders on ALL routes (incl. admin) — 8 concurrent CSS animations | `src/components/shared/ambient-background.tsx` | Critical |
| NavShell subscribes to 3 Zustand stores, rendered twice on homepage | `src/components/layout/nav-shell.tsx:21-25` | Critical |
| CartDrawer uses destructured store object selector — re-renders on every store change | `src/components/layout/cart-drawer.tsx:13` | Critical |
| Footer is full client component for one newsletter input | `src/components/layout/footer.tsx:1` | Critical |
| ProductGrid uses Framer Motion stagger — forces client bundle on every listing page | `src/components/products/product-grid.tsx:1` | Critical |
| SearchClient calls `router.replace()` on every debounced keystroke | `src/components/products/search-client.tsx:39-47` | High |
| QuickViewModal imports `server-only` ProductService into client bundle | `src/components/products/quick-view-modal.tsx:11` | High |
| EventBus blocks HTTP response on event publish | `src/lib/services/automation/event-bus.ts:39-41` | High |
| Every service method creates Supabase client + awaits `cookies()` even for mock fallback | ALL service files | High |
| AdminSidebar re-renders on every admin route transition | `src/components/admin/admin-sidebar.tsx` | High |
| Sitemap creates 3 separate Supabase clients | `src/app/sitemap.ts:7-12` | High |

### Bundle Size: ~170KB gzip

| Contributor | Size |
|---|---|
| Framer Motion | ~30KB |
| Radix UI primitives | ~20KB |
| lucide-react | ~15KB |
| RHF + Zod | ~22KB |
| Application code | ~80KB |

---

## Security Review

| Area | Assessment |
|---|---|
| **Admin Authentication** | ✅ Good — HMAC SHA-256 signed session cookies, httpOnly, sameSite=lax, secure in prod. |
| **Admin Middleware Gate** | ✅ Good — middleware checks session on every `/admin/*` request. |
| **Payment Verification** | ✅ Good — signature verification server-side via Razorpay HMAC. |
| **API Input Validation** | ✅ Good — Zod validation on all API route handlers. |
| **Sensitive Data** | ⚠️ Warning — mock data arrays contain fake customer PII (names, emails, addresses). These ship to the browser if a service endpoint is exposed. |
| **Rate Limiting** | ❌ Missing — no rate limiting on API routes (contact form, login, coupon validation). |
| **CSRF Protection** | ❌ Missing — no CSRF tokens on state-changing requests. |
| **Helmet / Security Headers** | ❌ Missing — no `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy` headers. |
| **Auth Bypass in Dev** | ⚠️ Warning — `middleware.ts` returns `NextResponse.next()` in dev mode. A developer running on `localhost:3000` has no admin auth. |
| **Customer Auth** | ❌ Missing — no customer authentication at all. |

---

## UI / UX Review

| Aspect | Score | Notes |
|---|---|---|
| **Design Quality** | 9/10 | Premium luxury, cohesive pink/apricot/lilac palette, pixel-perfect from design source |
| **Responsiveness** | 8/10 | Mobile-first, adaptive grid, mobile drawer nav |
| **Animations** | 8/10 | Rich but excessive — 15+ concurrent animations on hero, AmbientBackground always running |
| **Consistency** | 8/10 | Shared tokens, consistent radii/shadow patterns |
| **Typography** | 8/10 | Bricolage Grotesque + Inter Tight, good pairing |
| **Accessibility** | 3/10 | No semantic structure audit, no focus management, no skip links, no keyboard testing |
| **Dark Mode** | 0/10 | Config present but no dark palette |
| **Loading States** | 5/10 | Only homepage has skeletons. Admin pages, search, and transitions lack loading states |
| **Empty States** | 7/10 | Cart, wishlist, search, reviews have empty states |
| **Error States** | 2/10 | No error.tsx anywhere. API errors return JSON — no user-facing error UI |

---

## Technical Debt

| Item | Severity | Effort |
|---|---|---|
| `package.json` name is "gifted" but brand is "Lavisk" | Low | 1 min |
| `tailwind.config.ts` references `./src/features/**/*` — directory doesn't exist | Low | 1 min |
| QuickViewModal imports `ProductService` (server-only) in client component | High | 5 min |
| `CursorGlow` component likely unused | Low | 5 min to verify |
| All service methods duplicate Supabase + mock fallback pattern (~30 files) | Medium | 1-2 days |
| 4 shipping providers throw generic "not yet implemented" errors | Low | Until needed |
| In-process EventBus has no persistence — events lost on restart | Medium | Document or fix |
| Mock data arrays grow indefinitely on create operations | Low | Add cleanup |
| No `loading.tsx` in any route segment | Medium | 2 hours |
| No `error.tsx` in any route segment | Medium | 2 hours |
| Zustand UI store persists `isOpen` and `quickViewProductId` unnecessarily | Low | 15 min |

---

## Risks

1. **No customer authentication** — guest-only checkout means zero retention, zero order history, zero repeat purchase optimization. This is the single biggest business risk.

2. **In-process EventBus** — events are lost on server restart/crash. For a production e-commerce platform handling orders and payments, this is unacceptable. The ORDER_PAID event triggers stock decrement — if the event is lost, inventory goes out of sync.

3. **Mock data volatility** — in-memory arrays reset on every server restart. Admin users creating products/categories/coupons during development will lose all data.

4. **Accessibility liability** — WCAG 2.1 AA is a legal requirement in many jurisdictions for e-commerce. The current state (no focus management, no semantic structure audit, no skip links) is a legal risk.

5. **Single payment provider** — only Razorpay is implemented. If Razorpay has an outage, the store can't process payments.

6. **No error boundaries** — any unhandled exception in a server component or API route produces a white screen or generic 500. This is a production reliability risk.

7. **AmbientBackground performance** — 8 continuous CSS animations with `blur(60px)` on every page (including admin) will kill battery life on mobile and cause jank on lower-end devices.

---

## Code Smells

1. **QuickViewModal imports server-only service** — `import { ProductService } from "@/lib/services/product.service"` in a `"use client"` component. TypeScript doesn't error because the module is only used in `useEffect` with `fetch()`, but the entire service module is bundled to the client.

2. **NavShell computed selectors** — `useCartStore((s) => s.items.reduce(...))` computes a full array reduce on every subscription notification. Should be a derived value in the store.

3. **Footer state on every keystroke** — `const [email, setEmail] = useState("")` in a 106-line client component causes full re-render on every keystroke.

4. **CartDrawer destructures entire store** — `const { items, isOpen, closeCart, increment, decrement } = useCartStore()` subscribes to all fields.

5. **Admin API routes no caching** — all admin API GET endpoints return uncached responses.

6. **Every service creates Supabase client** — even when falling back to mock data, the call to `createClient()` awaits `cookies()` unnecessarily.

7. **`cursor-glow.tsx` exists** — likely unused. No parent in the layout tree uses it. Dead code.

8. **`features/` directory referenced in tailwind config** — doesn't exist. Dead glob pattern.

---

## Unused Components

| Component | File | Status |
|---|---|---|
| `CursorGlow` | `src/components/shared/cursor-glow.tsx` | Likely unused — not imported in any layout or page |
| `QuickViewModal` | `src/components/products/quick-view-modal.tsx` | Imported in `ClientShell` but `useUIStore.openQuickView` is never called from any visible trigger |

---

## Duplicate Code

| Pattern | Occurrences | Impact |
|---|---|---|
| `if (isSupabaseConfigured) { const supabase = await createClient(); ... }` mock fallback | ~30 service methods | Medium — maintenance burden |
| Star rating render (5 `Array.from` + Star icons) | 4 places (ProductCard, ProductDetail, ProductReviews, QuickViewModal) | Low — should be a shared `StarRating` component |
| Gradient background inline style `linear-gradient(150deg, ...)` | ~6 components | Low — should be a utility function |

---

## What Should NOT Be Changed

### Preserve These Architectural Decisions:

1. **Service layer abstraction** — components never touch the database directly. This is correct and must be preserved.

2. **Mock data fallback** — every service checks config and falls back gracefully. This enables development without any external services. Keep this pattern.

3. **Provider pattern for payments** — `PaymentProvider` interface with env-var-based provider selection. Clean, extensible, correct.

4. **Provider pattern for shipping** — same interface-driven approach. Keep.

5. **Event-driven automation** — EventBus + AutomationRegistry + ActivityLog is well-architected. The concept is correct; only the sync execution needs fixing.

6. **`server-only` boundary enforcement** — prevents service layer from being imported client-side. Keep and strengthen.

7. **Domain error hierarchy** — `AppError`, `NotFoundError`, `ValidationError`, etc. Clean error handling pattern. Keep.

8. **Centralized configuration** — `lib/core/config/index.ts` reads all env vars once. Keep.

9. **Design tokens in tailwind.config.ts** — the color palette, radii, shadows, and animations are pixel-perfect from the source design. Do NOT change these tokens.

10. **Zustand stores with persist** — cart and wishlist persistence is correct. Only optimize the selectors.

### Preserve These Components (they are well-architected):

- `Button` — CVA variants, Radix Slot support, clean API
- `Card` — proper compound component pattern
- `ProductCard` — clean separation of concerns, wishlist/cart integration
- `Hero` — polished, well-structured carousel
- `Navbar` — elegant scroll-reveal pattern
- `Magnetic` — clean pointer tracking with no dependencies
- `AmbientBackground` — concept is good, just needs conditional rendering
- All Radix UI wrappers — properly typed, forwardRef, cn() composition

---

## Recommended Roadmap

### Phase 0 — Foundation Fixes (Week 1)

| Task | Effort | Impact |
|---|---|---|
| Add `error.tsx` to all route segments | 2 hours | **High** — prevents white screens |
| Remove dead code (CursorGlow, features/ ref, "gifted" → "lavisk") | 30 min | Low |
| Conditionally render AmbientBackground (storefront only) | 15 min | Medium |
| Remove ProductService import from QuickViewModal | 5 min | Medium |
| Fix tailwind.config.ts content paths | 1 min | Low |

### Phase 1 — Performance (Week 1-2)

| Task | Effort | Impact |
|---|---|---|
| Split Footer into server + NewsletterForm client island | 1 hour | **High** |
| Optimize NavShell Zustand selectors (individual selectors, memoize) | 2 hours | **High** |
| Fix CartDrawer to use individual store selectors | 30 min | High |
| Make EventBus publish async (don't block request handlers) | 2 hours | High |
| Make ProductGrid server component with thin client stagger wrapper | 2 hours | High |
| Fix SearchClient to avoid router.replace on every keystroke | 1 hour | High |
| Audit font weights, remove unused variants | 30 min | Medium |
| Add `partialize` to Zustand persist (store only minimal data) | 30 min | Medium |

### Phase 2 — Accessibility (Week 2-3)

| Task | Effort | Impact |
|---|---|---|
| Full WCAG 2.1 AA audit | 1 day | **High** |
| Add focus management to Dialog/Sheet modals | 4 hours | High |
| Add skip-to-content link | 1 hour | Medium |
| Add aria-labels to all interactive elements | 4 hours | Medium |
| Test with screen reader (NVDA/VoiceOver) | 4 hours | High |
| Fix color contrast where needed | 2 hours | Medium |

### Phase 3 — Customer Authentication (Week 3-4)

| Task | Effort | Impact |
|---|---|---|
| Supabase Auth integration | 2 days | **Critical** |
| Login / Register / Password Reset pages | 1 day | High |
| Order history page | 1 day | Medium |
| Saved addresses | 1 day | Medium |
| Protected route middleware | 4 hours | High |

### Phase 4 — Testing (Week 4-5)

| Task | Effort | Impact |
|---|---|---|
| Increase unit test coverage to 70%+ on services | 2 days | High |
| Add API route integration tests | 1 day | High |
| Add E2E tests for critical flows (home → checkout → payment) | 2 days | High |
| Set up GitHub Actions CI/CD | 1 day | High |

### Phase 5 — Admin Panel Polish (Week 5-6)

| Task | Effort | Impact |
|---|---|---|
| Add loading states to all admin pages | 1 day | Medium |
| Add empty states to all admin tables | 4 hours | Medium |
| Improve order detail view | 1 day | Medium |
| Add bulk actions (orders, products) | 1 day | Low |
| Improve mobile admin layout | 1 day | Medium |

### Phase 6 — Remaining Integrations (Week 6-7)

| Task | Effort | Impact |
|---|---|---|
| Implement Cashfree payment provider | 1 day | Medium |
| Implement Stripe payment provider | 1 day | Medium |
| Implement Bluedart/Delhivery shipping providers | 2 days | Low |
| Add GA4 / Plausible analytics | 4 hours | Medium |

### Phase 7 — Launch Prep (Week 7-8)

| Task | Effort | Impact |
|---|---|---|
| Security headers (CSP, HSTS, X-Frame-Options) | 4 hours | High |
| Rate limiting on API routes | 4 hours | High |
| Production deployment with Vercel | 1 day | High |
| Performance Lighthouse audit (target 90+) | 1 day | High |
| SEO audit | 4 hours | Medium |

---

## Development Strategy

### Rules for Every Code Change

1. **Never rewrite working code.** If a component works and follows the existing patterns, don't refactor it. Only change what's broken or blocking.

2. **Reuse existing components.** Before creating a new UI component, check if an existing one (Button, Card, Badge, Dialog, Sheet) can be composed to achieve the goal.

3. **Preserve the service layer.** Components must never directly import Supabase or call the database. Always go through `lib/services/*`.

4. **Follow existing conventions.** The codebase uses consistent patterns: `cn()` for classes, `forwardRef` for UI primitives, PascalCase for components, camelCase for utilities, CVA for variants, Zod for validation.

5. **Prefer server components.** Only add `"use client"` when interactivity (state, effects, event handlers, browser APIs) is absolutely required. When in doubt, start as a server component.

6. **Minimize client JS.** Each `"use client"` directive is a commitment to hydrate. Extract interactivity into the smallest possible leaf components.

7. **One component, one responsibility.** If a component is doing two things, split it. Example: Footer = server shell + NewsletterForm client island.

8. **Optimize for maintainability, not cleverness.** Simple code that's easy to understand is better than elegant code that requires mental effort.

9. **Maintain the luxury aesthetic.** Every UI change must be visually consistent with the existing brand — pink/apricot/lilac palette, large rounded corners, subtle shadows, smooth animations.

10. **Never introduce breaking changes without explanation.** If a change requires modifying an existing component's API or behavior, document why and how consumers should update.

---

## Final Verdict

This is a remarkably well-engineered codebase. The architecture decisions are sound, the design system is premium, and the code quality is above average for a project at this stage of development.

### What should I build next?

**Customer authentication.** This is the single biggest gap. Without it, there's no retention, no order history, no saved addresses, no personalization. Implement Supabase Auth with login/register pages, a customer account area with order history, and protected route middleware.

### What should I avoid changing?

1. **The design system.** The color palette, typography, animations, radii, shadows, and component styling are pixel-perfect from a professional luxury design. Changing them would be a regression.

2. **The service layer abstraction.** The pattern of components → services → database/mock is correct. Do not bypass it.

3. **The provider patterns** (payment, shipping). The interface-driven approach is clean and extensible. Don't couple to specific providers.

4. **The event-driven automation framework** (EventBus, AutomationRegistry, ActivityLog). The concept is excellent — only fix the synchronous execution to avoid blocking request handlers.

### What should I optimize before production?

1. **Performance:** Fix the bundle size (Framer Motion on listing pages, dead imports), Zustand over-rendering, and always-running animations.
2. **Reliability:** Add error boundaries everywhere. The absence of `error.tsx` in any route segment is the single biggest reliability risk.
3. **Accessibility:** WCAG 2.1 AA compliance is a prerequisite for production launch.
4. **Security:** Add rate limiting, CSRF protection, and security headers. Fix the dev-mode auth bypass.
5. **Testing:** Increase test coverage from 32 tests to a meaningful safety net.
