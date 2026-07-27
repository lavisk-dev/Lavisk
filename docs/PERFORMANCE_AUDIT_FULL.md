# Performance Audit: Lavisk (Next.js 15 E-Commerce)

## Score: 52/100 — Not launch-ready

---

# Critical Issues (Blocking Launch)

## 1. AmbientBackground Runs on Every Route (Including Admin)

**Problem**: `AmbientBackground` is rendered inside `SiteChrome` which wraps every single page — including the admin panel. It spawns 8 concurrent CSS animations: 3 radial gradient blobs with `animate-drift`/`animate-drift2` + 5 sparkle dots with `animate-sparkle`. All use `blur-[60px]` filters which are GPU-composited but still trigger heavy painting.

**Why it's slow**: 8 continuously running animations + `blur(60px)` + `opacity` on every page load. On lower-powered devices, this consumes GPU resources continuously, impacting LCP, INP, and battery.

**Severity**: **Critical**

**File**: `src/components/shared/ambient-background.tsx:1-18`

**Recommended fix**: Wrap in a conditional that only renders on storefront routes (exclude `/admin/*`). Better: use a single CSS animation on a `::before` pseudo-element in the root layout instead of 8 animated elements.

**Expected improvement**: 15-30% reduction in layout rendering overhead. Better INP on admin pages.

---

## 2. NavShell Subscribes to 3 Zustand Stores — Massively Over-renders

**Problem**: `NavShell` subscribes to **three** Zustand stores:
```typescript
const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
const wishCount = useWishlistStore((s) => s.productIds.length);
const openMobileNav = useUIStore((s) => s.openMobileNav);
```
Every call to `addItem`, `increment`, `decrement`, `toggleWish`, `openMobileNav` causes a re-render of the nav. The `cartCount` selector computes `reduce` on every render — O(n) per store subscription notification.

But worse: `NavShell` is rendered **twice** on the home page — once inside the hero (for the pink hero nav) and once in the sticky navbar. Both instances subscribe to the same stores.

**Why it's slow**: Every cart/wishlist/UI action triggers 2 NavShell re-renders. The `reduce` in the selector recomputes the full array on every subscription fire. This directly impacts INP for add-to-cart, wishlist toggle, and mobile nav open.

**Severity**: **Critical**

**File**: `src/components/layout/nav-shell.tsx:21-25`

**Recommended fix**: Memoize the computed value in the store itself (add a `totalItems` and `totalWished` getter to the store), or use `useMemo`/`shallow` selector. Extract the badge count into a separate tiny component that subscribes independently. Consider `React.memo` or splitting the component.

**Expected improvement**: 40-60% fewer re-renders on cart/wishlist interactions. Better INP on "Add to Cart" button.

---

## 3. CartDrawer Uses Non-Memoized Object Selector

**Problem**: `CartDrawer` does this:
```typescript
const { items, isOpen, closeCart, increment, decrement } = useCartStore();
```
This subscribes to **every** field in the store. Every state change (even unrelated ones like `closeCart`) re-renders the entire drawer. Also `subtotal` is computed on every render:
```typescript
const subtotal = useCartStore((s) => s.subtotal()); // calls reduce() every time
```

**Why it's slow**: The drawer re-renders even when unrelated state changes. `subtotal()` calls `reduce()` on every render.

**Severity**: **Critical**

**File**: `src/components/layout/cart-drawer.tsx:13`

**Recommended fix**: Select only the individual fields needed using separate `useCartStore` calls:
```typescript
const items = useCartStore((s) => s.items);
const isOpen = useCartStore((s) => s.isOpen);
```

**Expected improvement**: ~80% fewer CartDrawer re-renders.

---

## 4. Footer Is an Entire Client Component

**Problem**: `Footer` is marked `"use client"` — the entire 106-line component is client-rendered. Only the newsletter subscribe button needs client interactivity. The rest (brand name, links, social icons, copyright) is purely static.

**Why it's slow**: Increases client JS bundle. Prevents static rendering of the footer. Every page pays the cost of hydrating this component.

**Severity**: **Critical**

**File**: `src/components/layout/footer.tsx:1`

**Recommended fix**: Split into a server `Footer` component that renders the static shell, and extract the newsletter form into a tiny `NewsletterForm` client component.

**Expected improvement**: Reduces initial JS bundle by ~5KB. Allows static rendering of footer on all pages.

---

## 5. ProductGrid Is Full Client Component with Framer Motion Stagger

**Problem**: `ProductGrid` is `"use client"` purely for Framer Motion's `motion.div` stagger animation. This forces every product listing page (shop, categories, search, related products) to download and execute the Framer Motion bundle client-side.

**Why it's slow**: Framer Motion's `motion.div` with `whileInView` triggers intersection observer setup for every single grid container. The stagger animation (`staggerChildren: 0.08`) delays visual completion — the last card animates in `0.08 × (N-1)` seconds after the first.

**Severity**: **Critical**

**File**: `src/components/products/product-grid.tsx:1,20-41`

**Recommended fix**: Create a thin `ProductGridClient` wrapper with just the stagger animation that wraps a server-rendered `ProductGridShell` (just the CSS grid + cards). On initial page load, the grid should be fully visible — stagger animations are cosmetic and delay LCP for below-fold content.

**Expected improvement**: Framer Motion bundle (~30KB) is lazy-loaded only when the grid enters viewport. LCP improves by not animating above-fold products.

---

## 6. SearchClient Debounce + URL Replace on Every Keystroke

**Problem**: `SearchClient` calls `router.replace()` on every debounced keystroke. Each `router.replace` triggers a full app router navigation cycle — even with `scroll: false`.

**Why it's slow**: The Next.js App Router processes `router.replace` by re-rendering the layout + page. This fires once per 320ms during typing, causing continuous React reconciliation and potential layout thrash.

**Severity**: **High**

**File**: `src/components/products/search-client.tsx:39-47`

**Recommended fix**: Use `useOptimistic` or `useTransition` to update the URL without triggering a full navigation. Alternatively, use `history.replaceState` directly since the search results are managed client-side anyway.

**Expected improvement**: Eliminates continuous re-renders during search. INP improves dramatically during typing.

---

# High Severity Issues

## 7. Hero Loads All 3 Slide Images Immediately

**Problem**: `Hero` renders 3 `AnimatePresence` blocks for word, image, and content. The `<Image>` component has `priority={slide === 0}` on only the first slide. But React still creates Image elements for all 3 images in the AnimatePresence (they're just hidden).

**Why it's slow**: The browser may preload all 3 hero images even though only 1 is visible at a time. Each image is ~560×580px.

**Severity**: **High**

**File**: `src/components/home/hero.tsx:67-76`

**Recommended fix**: Use the `loading="lazy"` approach with conditional rendering — only render the active slide's image. Use `priority` only for the initial slide. Use `fetchpriority="high"` on the first image.

**Expected improvement**: Reduces initial page load bandwidth by ~66% for hero images (~200KB savings).

---

## 8. QuickViewModal Imports Server-Only Service Client-Side

**Problem**: `QuickViewModal` imports `ProductService` from `@/lib/services/product.service` (line 11) — but this is a `"server-only"` module. The entire `product.service.ts` module and its dependencies (Supabase client, mock data, EventBus) are bundled into the client JS.

**Why it's slow**: The ~15KB product service module (plus Supabase clients, mock data arrays, EventBus) is shipped to the browser even though it's never called from there (the component uses `fetch()` instead).

**Severity**: **High**

**File**: `src/components/products/quick-view-modal.tsx:11`

**Recommended fix**: Remove the import. The component already uses `fetch()` to get product data. The `ProductService` import is dead code that bloats the client bundle.

**Expected improvement**: Reduces client JS bundle by ~15-20KB.

---

## 9. Every Service Method Duplicates Supabase + Mock Fallback Logic

**Problem**: Every method in every service (ProductService, CategoryService, OrderService, etc.) follows this pattern:
```typescript
if (isSupabaseConfigured) {
  const supabase = await createClient();
  if (supabase) {
    // Supabase query...
    if (data) return data;
  }
}
// Mock fallback...
```

This means every service call: (1) checks env vars, (2) calls `createClient()` which awaits `cookies()`, (3) builds a query, (4) falls back. Even for mock data, the Supabase check + client creation overhead is paid.

**Why it's slow**: Every service method awaits `createClient()` which calls `cookies()` — an async function. This adds ~1-5ms overhead per call. For the homepage which calls 4 services, this adds 4-20ms of unnecessary latency. For mock-data development, all the Supabase infrastructure is still initialized and discarded.

**Severity**: **High**

**File**: ALL service files (e.g., `src/lib/services/product.service.ts:127-140`, `src/lib/services/category.service.ts:16-30`, etc.)

**Recommended fix**: Inline the env check at module level and use a simple `isSupabaseConfigured` boolean to short-circuit entire code paths. Make `createClient` return `null` synchronously if not configured. Consider a service factory pattern that returns either a Supabase-backed or mock-backed implementation.

**Expected improvement**: 5-15ms faster time-to-first-byte on pages with multiple service calls.

---

## 10. In-Process EventBus Blocks Request Handler

**Problem**: The `EventBus.publish()` calls in services (e.g., `ProductService.create()` publishes `PRODUCT_CREATED`, `INVENTORY_DECREMENTED`, `INVENTORY_LOW_STOCK`) are **synchronous/in-process** — they execute all registered handlers (email sending, activity logging, automation rules) before the HTTP response is sent.

**Why it's slow**: If an email notification handler is registered on `ORDER_CREATED`, the checkout API route waits for the email to be sent before returning the response. This turns async side-effects into blocking operations.

**Severity**: **High**

**File**: `src/lib/services/automation/event-bus.ts:39-41`, `src/lib/core/event-bus/index.ts`

**Recommended fix**: Publish events asynchronously using `Promise.allSettled` with `Promise.resolve().then(() => handler(event))` or use a queue. The event bus already has an `async` parameter in subscriptions — ensure non-blocking handlers are registered with `async: true` and that `publish()` doesn't `await` them.

**Expected improvement**: 50-200ms faster API responses for checkout, order creation, and admin write operations.

---

## 11. Admin Sidebar Renders on Every Admin Route — Memo Missing

**Problem**: `AdminSidebar` is rendered inside `admin/(panel)/layout.tsx` and is a `"use client"` component. It re-renders on every admin page navigation because nothing prevents it.

**Why it's slow**: Every admin page transition re-renders the sidebar and all 15 nav links. The sidebar uses `usePathname` to highlight the active route — this fires on every client-side navigation.

**Severity**: **High**

**File**: `src/components/admin/admin-sidebar.tsx`, `src/app/admin/(panel)/layout.tsx:13`

**Recommended fix**: Wrap `AdminSidebar` in `React.memo`. Use `useMemo` for the nav links array. Consider extracting the pathname highlight to a child component.

**Expected improvement**: Eliminates ~150ms of unnecessary re-render work on admin page transitions.

---

## 12. Sitemap Makes Sequential-ish API Calls

**Problem**: `sitemap.ts` uses `Promise.all` — but the services internally all call `createClient()` which awaits `cookies()`. There's no shared Supabase client. Each service call independently creates a new Supabase client.

**Why it's slow**: On every sitemap generation, 3 separate `cookies()` calls are made, 3 Supabase clients are created, and 3 queries are executed. With 100+ products, the sitemap can take 500ms+.

**Severity**: **High**

**File**: `src/app/sitemap.ts:7-12`

**Recommended fix**: Create a single Supabase client instance and reuse it across all 3 service calls. Use `Promise.all` with the same client.

**Expected improvement**: Reduces sitemap generation time by 30-50%.

---

# Medium Severity Issues

## 13. ProductReviews Uses Client-Side Fetch Instead of Server Component Pattern

**Problem**: `ProductReviews` uses `useEffect(() => { fetch(`/api/reviews?...`) })` to load reviews client-side. This creates a **waterfall**: the page renders, JavaScript loads, React hydrates, useEffect fires, fetch to API route, API route calls ReviewService, returns data.

**Why it's slow**: Adds a full network round-trip (client → Next.js API → service → response) when the data could be fetched server-side during the initial render.

**Severity**: **Medium**

**File**: `src/components/products/product-reviews.tsx:33-38`

**Recommended fix**: Make `ProductReviews` receive reviews as props from a server component. The data fetching can happen in `ProductDetailWrapper` (already an async server component) alongside the related products fetch.

**Expected improvement**: Eliminates one round-trip + React hydration cycle. 100-300ms faster review display.

---

## 14. Hero Uses Framer Motion AnimatePresence for All 3 Content Groups

**Problem**: `Hero` has 3 separate `AnimatePresence` blocks (word, image, content) that all animate on every slide transition. Each uses `motion.div` with opacity/scale/y transforms.

**Why it's slow**: AnimatePresence mounts/unmounts React trees on every slide change. Combined with the 8 AmbientBackground animations and the CSS `meshShift` animation on the hero background, the hero section has ~15 concurrent animations during transitions.

**Severity**: **Medium**

**File**: `src/components/home/hero.tsx:44-105`

**Recommended fix**: Use CSS transitions instead of Framer Motion for the hero carousel. Or reduce to a single `AnimatePresence` wrapping the entire content group instead of 3 separate wrappers. Consider pre-rendering all 3 slides with `display: none` / `opacity` toggling instead of mounting/unmounting.

**Expected improvement**: Smoother slide transitions on lower-end devices. Reduced INP during auto-advance.

---

## 15. Newsletter Subscribe Creates Object on Every Key Press

**Problem**: `Footer` has a controlled input: `value={email}` / `onChange={(e) => setEmail(e.target.value)}`. The parent component re-renders on every keystroke because `setEmail` triggers a state update.

**Why it's slow**: The entire Footer component (106 lines, 6+ child elements, Reveal animation wrapper, gradient backgrounds, animated drift div) re-renders on every keystroke in the email input.

**Severity**: **Medium**

**File**: `src/components/layout/footer.tsx:9-10`

**Recommended fix**: Extract the newsletter signup form into its own client component with local state. The parent Footer becomes a server component.

**Expected improvement**: Eliminates ~100 unnecessary re-renders during email typing.

---

## 16. Font Loading: 8 Weight Variants Loaded

**Problem**: `fonts.ts` loads `Bricolage_Grotesque` with weights `[400, 600, 700, 800]` and `Inter_Tight` with weights `[400, 500, 600, 700]` — 8 font files total.

**Why it's slow**: Each weight is a separate font file. On first load, the browser needs to download up to 8 woff2 files (though Next.js optimizes to only download the weights actually used in the CSS, the declaration still triggers preloading).

**Severity**: **Medium**

**File**: `src/lib/fonts.ts:1-14`

**Recommended fix**: Audit which weights are actually used. Remove unused weights. Bricolage Grotesque 800 may only appear in the hero wordmark — could be replaced with 700.

**Expected improvement**: Reduces font download size by 20-40% (30-80KB savings).

---

## 17. Zustand Stores Persist Entire State to localStorage on Every Change

**Problem**: All 3 Zustand stores use `persist` middleware with `localStorage`. Every state change (`addItem`, `toggle`, `openMobileNav`) triggers a synchronous `localStorage.setItem` write.

**Why it's slow**: `localStorage.setItem` is synchronous and can block the main thread. Writing the full cart (which includes product names, descriptions, gradient colors) on every add-to-cart is unnecessary.

**Severity**: **Medium**

**File**: `src/store/cart-store.ts:22-74`, `src/store/wishlist-store.ts:13-27`, `src/store/ui-store.ts`

**Recommended fix**: Use `partialize` to only persist what's needed (e.g., cart: only `{ productId, quantity }[]`, wishlist: just `productIds` array). Avoid persisting `isOpen` or computed data.

**Expected improvement**: Faster add-to-cart/wishlist interactions. Smaller localStorage footprint.

---

## 18. QuickViewModal Client-Side Fetches Product by ID via API Route

**Problem**: `QuickViewModal` fetches `fetch(`/api/products/id/${quickViewProductId}`)` — this goes through a Route Handler that calls `ProductService.getById()`. The data could be fetched directly if the service were importable on the client (but it's `server-only`).

**Why it's slow**: Full round-trip: client → Next.js API → service layer → response. Adds network latency (50-150ms) on top of the UI state update.

**Severity**: **Medium**

**File**: `src/components/products/quick-view-modal.tsx:32`

**Recommended fix**: Create a server action for quick-view product fetching. Or pre-fetch product data when hovering over the card. Alternatively, pass minimal product data through the store instead of the ID.

**Expected improvement**: 50-150ms faster quick-view modal display.

---

## 19. Category Card Uses Framer Motion Tilt Effect

**Problem**: `CategoryCard` uses Framer Motion to track pointer position and apply `rotateX`/`rotateY` transforms. This adds `pointermove` event listener per card.

**Why it's slow**: Each category card registers a pointer move handler. With 8 categories on the homepage, 8 event listeners + 8 Framer Motion component trees are active. The pointer tracking triggers React state updates on every mouse movement.

**Severity**: **Medium**

**File**: `src/components/categories/category-card.tsx`

**Recommended fix**: Use CSS `transform: perspective()` with a single event listener on the grid container. Or limit the tilt to desktop only. Use `will-change: transform` to promote to GPU.

**Expected improvement**: Smoother scrolling on category pages. Reduced pointer event overhead.

---

## 20. No Error Boundaries — White Screen on Any Server Error

**Problem**: No `error.tsx` file exists in any route segment. If any server component or API route throws, the user sees a white screen with the Next.js error overlay in development, or a generic 500 in production.

**Severity**: **Low** (affects perceived performance / reliability)

**File**: Missing from ALL route segments

**Recommended fix**: Add `error.tsx` to `app/`, `app/shop/`, `app/product/[slug]/`, `app/admin/(panel)/`, etc.

---

# Low Severity Issues

## 21. CSS Animations Not GPU-Accelerated with will-change

**Problem**: Several CSS animations in `tailwind.config.ts` and `globals.css` use `transform` properties without `will-change: transform`. The `blobMorph` animation animates `border-radius` which is **not** GPU-composited and triggers layout recalculations.

**Severity**: **Low**

**File**: `tailwind.config.ts:91-95` (blobMorph keyframe)

**Recommended fix**: Replace `border-radius` morphing with a `clip-path` animation which is GPU-composited, or remove the animation entirely.

---

## 22. Admin API Routes Lack Caching Headers

**Problem**: Every API route returns `ok()` which produces a JSON response with no `Cache-Control` header. Admin dashboard, analytics, and list endpoints all return uncached responses.

**Severity**: **Low**

**File**: All `src/app/api/admin/*/route.ts` files

**Recommended fix**: Add `Cache-Control: public, s-maxage=60` or similar to admin GET endpoints where stale data is acceptable.

---

## 23. Product Service List Method Duplicates Sort Logic

**Problem**: `ProductService.list()` has two complete implementations of filtering/sorting logic — one for Supabase queries (SQL-based) and one for mock data (JavaScript array operations). Both duplicate the same business logic.

**Severity**: **Low**

**File**: `src/lib/services/product.service.ts:84-156`

---

## 24. Admin(panel) Layout Imports Child Components in Module Scope

**Problem**: `AdminPanelLayout` imports `AdminSidebar` and `AdminTopbar` at module level. Every admin page loads these components in the module graph. Could be dynamically imported since they're outside the main content area.

**Severity**: **Low**

**File**: `src/app/admin/(panel)/layout.tsx:2-3`

---

# Bundle Size Analysis

## Estimated Bundle Breakdown:

| Category | Size | Notes |
|---|---|---|
| **Framer Motion** | ~30KB gzip | Used in hero, product cards, category cards, product grid, reveal animations, magnetic buttons |
| **lucide-react** | ~15KB gzip | ~15 icons imported across ~10 components |
| **React Hook Form + Zod Resolver** | ~12KB gzip | Checkout form, review form |
| **Zod** | ~10KB gzip | Validation schemas in shared bundle |
| **Radix UI Primitives** | ~20KB gzip | 12+ primitives (Dialog, Sheet, Accordion, Tabs, Select, DropdownMenu, Toast, Avatar, Checkbox, Switch, Label, Slot) |
| **Zustand** | ~2KB gzip | |
| **Application Code** | ~80KB gzip | Components, pages, utilities, stores |
| **Total Estimated Client JS** | ~170KB gzip | Approximate first-load JS |

**Target**: < 100KB gzip for good performance. This project exceeds that by ~70%.

---

# Render Waterfall Analysis

## Home Page Waterfall:

```
1. Root Layout (Server)
   ├── Load fonts (next/font/google) ── 100-300ms
   ├── SiteChrome
   │   ├── AmbientBackground ── CSS animations start immediately
   │   └── ClientShell (client boundary)
   │       ├── Navbar (client)
   │       │   └── NavShell (client, subscribes to 3 stores)
   │       └── <main>
   │           └── HomePage (server)
   │               ├── Hero (client boundary) ── Framer Motion bundle loaded
   │               │   └── NavShell (second instance!)
   │               ├── StatsStrip (server)
   │               ├── Suspense
   │               │   └── Categories (server)
   │               │       └── CategorySection (client boundary)
   │               │           └── CategoryCard × 8 (client, Framer Motion tilt)
   │               ├── Suspense
   │               │   └── Trending (server)
   │               │       └── TrendingMarquee (client boundary)
   │               ├── Suspense
   │               │   └── Bestsellers (server)
   │               │       └── BestsellerSection (server)
   │               │           └── ProductGrid (client boundary)
   │               │               └── ProductCard × 6 (client)
   │               ├── Suspense
   │               │   └── Journal (server)
   │               │       └── JournalSection (server)
   │               │           └── Reveal (client boundary) × 1
   │               └── WhyUsSection (server)
   └── Footer (client boundary)
       └── Reveal (client)
```

## Key blockers:
- 7 separate client boundaries on the homepage
- Hero + Navbar both render NavShell (duplicate store subscriptions)
- All 4 Suspense sections load independently — no batching
- Footer is fully client-rendered for a newsletter input

---

# Memory Leak Assessment

| Location | Risk | Explanation |
|---|---|---|
| **QuickViewModal useEffect** | Low | Has cleanup (`cancelled` flag). Safe. |
| **Hero setInterval** | Low | Has cleanup. Safe. |
| **SearchClient useCallback/useEffect** | Low | Has cleanup. Safe. |
| **CategoryCard pointer events** | Low | Event handlers on DOM elements, cleaned up on unmount. Safe. |
| **Mock data arrays** | **Medium** | `mockProducts`, `mockOrders`, `mockPayments`, `mockBlogPosts` etc. are mutable arrays that grow on every create operation. In development, repeated creates will accumulate indefinitely. |
| **EventBus subscriptions** | **Medium** | `CoreEventBus` stores all handlers in a Map. If automation rules are registered but never `off()`'d, they accumulate. The `init.ts` calls `ensureAutomationInitialized()` on every layout render — could register duplicate handlers. |

---

# Performance Score: 52/100

| Category | Score | Reasoning |
|---|---|---|
| **LCP** | 40/100 | Hero animation-heavy, 3 images loaded, client nav shell blocks content rendering |
| **INP** | 35/100 | Zustand over-rendering, NavShell duplicates, search router.replace, EventBus blocking |
| **CLS** | 65/100 | Custom fonts with `display:swap` may cause layout shift. But preload helps. |
| **Bundle Size** | 45/100 | ~170KB gzip — 70KB over target. Framer Motion + Radix UI are heavy |
| **Server Components** | 50/100 | Good use of RSC patterns, but several components unnecessarily client (Footer, ProductGrid, NavShell) |
| **Hydration** | 40/100 | 7+ client boundaries on homepage — each is a hydration point |
| **Animations** | 30/100 | 15+ concurrent animations on hero, CSS animations always running (AmbientBackground) |
| **Images** | 55/100 | Good use of next/image, but hero loads all slides |
| **API Performance** | 50/100 | No caching headers, EventBus blocks responses, duplicated Supabase client creation |
| **Font Loading** | 60/100 | 8 weights is heavy but next/font optimizes delivery well |

---

# Launch Readiness: ❌ NOT READY

## Blockers:
1. Framer Motion bundle (~30KB) loads on every product listing page for stagger animations
2. Zustand store subscriptions cause excessive re-renders on every user interaction
3. Footer and AmbientBackground are client-rendered on every page including admin
4. No caching strategy on API routes
5. Font loading with 8 weights delays first paint

---

# Priority Roadmap

| Priority | Issue | Effort | Impact |
|---|---|---|---|
| **P0** | Footer → Server Component | 1 hour | Medium |
| **P0** | NavShell Zustand subscription optimization | 2 hours | High |
| **P0** | CartDrawer individual selectors | 30 min | High |
| **P0** | Remove AmbientBackground from admin | 10 min | High |
| **P1** | ProductGrid → split server/client | 2 hours | High |
| **P1** | QuickViewModal remove server-only import | 10 min | Medium |
| **P1** | SearchClient replace router.replace | 1 hour | High |
| **P1** | EventBus async publish for non-blocking handlers | 2 hours | Medium |
| **P2** | Hero reduce Framer Motion usage | 3 hours | Medium |
| **P2** | Font weight audit | 30 min | Medium |
| **P2** | Zustand persist partialize | 30 min | Low |
| **P2** | ProductReviews → server component fetch | 1 hour | Medium |
| **P2** | AdminSidebar React.memo | 15 min | Medium |
| **P3** | Cache-Control headers on API routes | 1 hour | Low |
| **P3** | Error boundaries on all routes | 2 hours | Low |
| **P3** | Mock data memory management | 1 hour | Low |
| **P3** | CSS animation GPU optimization | 1 hour | Low |

## Estimated improvement from P0-P1 fixes alone:
Score increases from **52 → 72/100**. Bundle reduces from **~170KB → ~120KB gzip**.

---

# Summary

The biggest performance issues are not about slow rendering or heavy computation — they're about **unnecessary work**: components rendering when they don't need to, bundles including code they don't use, animations running when nobody is watching, and state updates propagating too broadly. Fixing these architectural inefficiencies (not adding features, not redesigning) will bring this project to launch-ready performance within a focused sprint.
