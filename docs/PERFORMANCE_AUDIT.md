  # Performance Audit Report — Lavisk

  **Date**: 2026-07-24
  **Auditor**: Principal Performance Engineer
  **Build**: 59 routes, Next.js 15.5.20, First Load JS shared: 102 kB

  ---

  ## Executive Summary

  **Overall Performance Score: C (Needs Improvement)**

  Lavisk's architecture is structurally sound (service layer, Suspense boundaries, parallel data fetching) but has a **critical client-component boundary problem** that turns nearly every page into a client-rendered experience. The heavy use of Framer Motion, lack of font optimization, and missing Next.js performance features compound the issue.

  | Area | Score | Status | Recommendation |
  |---|---|---|---|
  | Initial Load | D | `SiteChrome` forces entire page tree into client rendering | Split layout into server/client boundary at a lower level |
  | FCP / LCP | D | Blocking Google Fonts, large hero bundle | Use `next/font`, lazy-load hero below-fold content |
  | TTI / TBT | D | 102 kB shared JS, heavy animation runtime | Reduce client JS, defer animations |
  | Bundle Size | C | 102 kB shared; framer-motion is 32 kB+ min | Dynamic import heavy components |
  | Images | B | Good use of `fill` + `sizes`, no WebP/AVIF config | Add image format optimization |
  | Fonts | F | Google Fonts `<link>` blocking render | Must use `next/font` |
  | Server Rendering | B | Good use of RSC, Suspense, parallel fetch | Minor improvements |
  | Client Components | F | `SiteChrome` wraps entire app — deep boundary issue | Restructure layout server/client split |
  | API Response Time | B | In-memory mock fast; Supabase queries unmeasured | Add query timing |
  | Animations | D | Framer Motion on every interaction, tilt, magnetic | Reduce spring physics count |
  | State Management | B | Zustand well-structured, persistent | Minor selector optimizations |
  | CSS | B | Tailwind efficient, some unused animation keyframes | Purge unused animations |
  | Accessibility | B | Good semantic HTML, aria labels | Reduced-motion support present |
  | SEO | A | Full JSON-LD, sitemap, good metadata | No issues |

  ---

  ## Top 20 Performance Problems

  ### Issue 1 — CRITICAL
  **`SiteChrome` wraps every page as a Client Component**

  - **Location**: `src/components/layout/site-chrome.tsx:1`
  - **Root Cause**: The `"use client"` directive at the top of `SiteChrome` means every page rendered inside `<SiteChrome>{children}</SiteChrome>` is part of the client component tree. All server component benefits (reduced JS, streaming, no hydration) are lost for the full page.
  - **Why it happens**: `SiteChrome` needs `usePathname()` to detect admin routes, plus it renders `<Navbar>`, `<MobileNav>`, `<CartDrawer>`, `<QuickViewModal>`, `<AmbientBackground>`, and `<Footer>` — all client components.
  - **Performance Impact**: **CRITICAL**. Every page ships the full client JS bundle (102 kB shared + page-specific). Server components below this boundary still render on the server but then must be hydrated. The entire homepage, shop page, etc. are wrapped in client JS.
  - **Recommended Fix**: Separate the layout into two parts: a server layout (wraps children without `"use client"`) and a client shell (`<Navbar>`, `<Footer>`, `<CartDrawer>`, `<MobileNav>`, `<QuickViewModal>`, `<AmbientBackground>`) that renders independently via React portals or a dedicated client wrapper.
  - **Estimated Improvement**: 40-60% reduction in first-load JS for pages like /about, /contact, /blog
  - **Difficulty**: Medium (2-4 hours)
  - **Priority**: P0

  ### Issue 2 — CRITICAL
  **Google Fonts loaded via `<link>` instead of `next/font`**

  - **Location**: `src/app/layout.tsx:47-50`
  - **Root Cause**: Fonts are loaded via an external Google Fonts CSS stylesheet. This is a blocking render resource — the browser must download, parse, and apply the stylesheet before rendering text. With `next/font`, fonts are self-hosted and served from the same origin, eliminating the DNS lookup, TCP connection, and SSL handshake to `fonts.googleapis.com` and `fonts.gstatic.com`.
  - **Why it happens**: The inline comment in `src/lib/fonts.ts` says "Fonts are loaded via <link> tags… avoiding build-time dependency on fetching Google Fonts at build time."
  - **Performance Impact**: **CRITICAL**. Two external connections to Google Fonts (one for CSS, one for font files). Each font weight adds ~20-30 kB. Bricolage Grotesque (4 weights) + Inter Tight (4 weights) = roughly 120-200 kB of font data from an external origin.
  - **Recommended Fix**: Use `next/font/google` for both font families, selecting only the weights actually used (Bricolage: 600, 700, 800; Inter Tight: 400, 500, 600, 700).
  - **Estimated Improvement**: 200-400ms reduction in FCP
  - **Difficulty**: Easy (15 minutes)
  - **Priority**: P0

  ### Issue 3 — HIGH
  **`AmbientBackground` renders on every page with heavy CSS animations**

  - **Location**: `src/components/shared/ambient-background.tsx`
  - **Root Cause**: Three large blurred radial gradient blobs (46vw, 52vw, 34vw) each with `animate-drift` or `animate-drift2` and `blur-[60px]`, plus 5 sparkle dots. These render on **every single page** including admin pages.
  - **Why it happens**: Fixed-position background element for brand aesthetic.
  - **Performance Impact**: **HIGH**. Three large blurred divs with infinite CSS animations cause compositor work on every frame. On low-end devices, `blur-[60px]` with large elements is expensive to paint. These run even when scrolled far from them.
  - **Recommended Fix**: 
    1. Remove from admin pages (site-chrome already checks for admin)
    2. Only render when the user hasn't set `prefers-reduced-motion`
    3. Reduce blur radius on mobile
    4. Consider using a static SVG background instead of animated CSS blobs
  - **Estimated Improvement**: 10-15% reduction in compositor thread work
  - **Difficulty**: Easy (30 minutes)
  - **Priority**: P1

  ### Issue 4 — HIGH
  **`CursorGlow` is not rendered but its pattern demonstrates expensive pointer tracking**

  - **Location**: `src/components/shared/cursor-glow.tsx`
  - **Note**: This component exists but is NOT imported in `SiteChrome`. However, its pattern is instructive — the code uses `requestAnimationFrame` loop with pointer tracking.
  - **Actual Impact**: The `Hero` component uses a similar pattern with `onPointerMove` for tilt effect, plus `Magnetic` components use spring physics on pointer move.

  ### Issue 5 — HIGH
  **Hero component combines 5+ animation systems simultaneously**

  - **Location**: `src/components/home/hero.tsx`
  - **Root Cause**: The Hero uses: (1) auto-rotating carousel with `setInterval`, (2) `AnimatePresence` for 3 content regions (eyebrow, word, subtitle, image), (3) tilt effect with `useMotionValue` + `useSpring`, (4) `animate-wordDrift` for background word, (5) `animate-letterIn` for individual letters, (6) `animate-ctaPulse` for CTA button, (7) `animate-meshShift` for background gradient.
  - **Performance Impact**: **HIGH**. The hero mounts multiple Framer Motion animations and CSS animations simultaneously. Each slide transition triggers 4 concurrent `AnimatePresence` animations. The tilt listener fires on every pointer move.
  - **Recommended Fix**:
    1. Reduce `AnimatePresence` regions — animate the container, not individual elements
    2. Remove the per-letter animation on the background wordmark (imperceptible)
    3. Debounce tilt handler
    4. Consider static hero with CSS-only transitions instead of Framer Motion
  - **Estimated Improvement**: 20-30% reduction in main-thread work during slide transitions
  - **Difficulty**: Medium (2-3 hours)
  - **Priority**: P1

  ### Issue 6 — HIGH
  **`Magnetic` component used 7+ times across the page with spring physics**

  - **Location**: `src/components/shared/magnetic.tsx`
  - **Root Cause**: Each `Magnetic` wrapper creates a `useMotionValue` + `useSpring` pair (2 spring instances). Used in: Footer (social icons + checkout CTA), Hero CTA, ProductCard (add-to-cart), ProductDetail (add-to-cart), CartDrawer (checkout button).
  - **Performance Impact**: **HIGH**. Each spring instance adds Framer Motion's physics simulation to the animation frame loop. 7+ instances simultaneously means 7+ spring calculations per frame.
  - **Recommended Fix**: Limit `Magnetic` to 1-2 key locations (hero CTA only). Replace other instances with CSS `:hover` transforms.
  - **Estimated Improvement**: Reduce Framer Motion's frame-budget consumption by ~30%
  - **Difficulty**: Easy (30 minutes)
  - **Priority**: P1

  ### Issue 7 — HIGH
  **`Reveal` wrapper creates a Framer Motion variant on every scroll-triggered section**

  - **Location**: `src/components/shared/reveal.tsx`
  - **Root Cause**: Every section wrapped in `<Reveal>` creates a `motion.div` with `whileInView` observer. Used 10+ times on the homepage alone (CategorySection heading + body, BestsellerSection heading + body, WhyUs cards, Footer, etc.).
  - **Performance Impact**: **HIGH**. Each `Reveal` registers an `IntersectionObserver` entry. 10+ observers on a single page is excessive. While observers are cheap, the animation triggers on scroll can cause jank.
  - **Recommended Fix**: Use a single `IntersectionObserver` at the section level instead of wrapping each element. Reduce `Reveal` usage to major section headings only.
  - **Estimated Improvement**: Reduce scroll-time main-thread work by 15%
  - **Difficulty**: Easy (1 hour)
  - **Priority**: P1

  ### Issue 8 — MEDIUM
  **No `next/dynamic` used for heavy client components**

  - **Location**: Multiple components
  - **Root Cause**: `QuickViewModal`, `CartDrawer`, `MobileNav`, `CheckoutClient`, `SearchClient`, `ProductReviews` are all eagerly loaded client components. None use `next/dynamic` with `ssr: false`.
  - **Performance Impact**: **MEDIUM**. `CartDrawer` (always mounted with Sheet), `MobileNav` (always mounted), `QuickViewModal` (always mounted but hidden), `ProductReviews` (client-side data fetching) all ship their JS on every page load.
  - **Recommended Fix**: 
    1. `QuickViewModal` → `dynamic(() => import('./QuickViewModal'), { ssr: false })`
    2. `CartDrawer` → `dynamic(() => import('./CartDrawer'), { ssr: false })`
    3. `MobileNav` → `dynamic(() => import('./MobileNav'), { ssr: false })`
  - **Estimated Improvement**: 15-25 kB reduction in initial JS bundle
  - **Difficulty**: Easy (20 minutes)
  - **Priority**: P2

  ### Issue 9 — MEDIUM
  **`CartService.price()` does N+1 sequential product lookups**

  - **Location**: `src/lib/services/cart.service.ts:38-55`
  - **Root Cause**: The `for...of` loop calls `await ProductService.getById()` sequentially for each cart item. With 10 cart items, this is 10 sequential database queries.
  - **Performance Impact**: **MEDIUM**. Each iteration adds RTT latency. With Supabase, 10 sequential queries could take 500ms+ instead of 50ms for a single batch query.
  - **Recommended Fix**: Create a `getByIds(ids: string[])` method on `ProductService` that does a single `SELECT * FROM products WHERE id IN (...)` query.
  - **Estimated Improvement**: 5-10x faster cart pricing for multi-item carts
  - **Difficulty**: Easy (30 minutes)
  - **Priority**: P2

  ### Issue 10 — MEDIUM
  **`StatsStrip` uses `requestAnimationFrame` count-up animation on mount**

  - **Location**: `src/components/home/stats-strip.tsx:13-33`
  - **Root Cause**: Each of the 3 stat counters runs a `requestAnimationFrame` loop for 1700ms when scrolled into view. The `useCountUp` hook creates a new `requestAnimationFrame` per stat (3 total).
  - **Performance Impact**: **MEDIUM**. During the 1700ms animation window, 3 `rAF` loops are running simultaneously. On low-end devices (mobile), this competes with other animations.
  - **Recommended Fix**: 
    1. Use CSS transition with a single state change instead of rAF loop
    2. Or use a lightweight count-up library
    3. Or reduce to a single rAF loop that updates all 3 counters
  - **Estimated Improvement**: Reduced frame drops during scroll
  - **Difficulty**: Easy (30 minutes)
  - **Priority**: P2

  ### Issue 11 — MEDIUM
  **`CartDrawer` subscribes to the full store but only uses parts**

  - **Location**: `src/components/layout/cart-drawer.tsx:13-14`
  - **Root Cause**: `const { items, isOpen, closeCart, increment, decrement } = useCartStore();` — this destructures from the entire store, causing re-render on every store change. `const subtotal = useCartStore((s) => s.subtotal());` is good (selector), but the first line subscribes to the full state.
  - **Performance Impact**: **MEDIUM**. Every `addItem` or `increment` call triggers a re-render of the entire `CartDrawer` component, even though it may not need to update all its children.
  - **Recommended Fix**: Select individual slices: `const items = useCartStore((s) => s.items);` etc.
  - **Estimated Improvement**: Reduced re-render scope for cart operations
  - **Difficulty**: Easy (10 minutes)
  - **Priority**: P2

  ### Issue 12 — MEDIUM
  **`ProductCard` subscribes to multiple Zustand stores causing re-renders**

  - **Location**: `src/components/products/product-card.tsx:22-25`
  - **Root Cause**: Each `ProductCard` subscribes to `useCartStore`, `useWishlistStore`, and `useUIStore`. With 48 products on the shop page, any wishlist toggle re-renders all 48 cards (since `isWished` uses a non-memoized selector).
  - **Performance Impact**: **MEDIUM**. Toggling a wishlist item causes 48 card re-evaluations. On the shop page with 48 items, this is CPU-intensive.
  - **Recommended Fix**: 
    1. Move wishlist state management to a higher level (pass `isWished` as prop)
    2. Use `React.memo` on `ProductCard` with shallow comparison
    3. Or use a dedicated WishlistButton component that subscribes independently
  - **Estimated Improvement**: 90% fewer re-renders on wishlist toggle (from 48 to 1)
  - **Difficulty**: Medium (1-2 hours)
  - **Priority**: P2

  ### Issue 13 — MEDIUM
  **No `React.memo()` on any component**

  - **Location**: All components
  - **Root Cause**: No component uses `React.memo()` for render bail-out. Every parent re-render cascades to all children.
  - **Performance Impact**: **MEDIUM**. The SiteChrome re-render cascade (pathname change → Navbar → NavShell → every link) affects every page navigation.
  - **Recommended Fix**: Add `React.memo` to leaf components that are re-rendered frequently: `ProductCard`, `CategoryCard`, `NavShell`, `Footer` link lists.
  - **Estimated Improvement**: Reduced cascading re-renders, especially on navigation
  - **Difficulty**: Easy (30 minutes)
  - **Priority**: P2

  ### Issue 14 — MEDIUM
  **No image optimization format set**

  - **Location**: `next.config.mjs`
  - **Root Cause**: `next.config.mjs` doesn't set `images.formats: ['image/avif', 'image/webp']`. Next.js defaults to WebP only.
  - **Performance Impact**: **MEDIUM**. AVIF provides 30% better compression than WebP for the same quality. Product images could be 30% smaller.
  - **Recommended Fix**: Add `images: { formats: ['image/avif', 'image/webp'] }` to next.config.mjs
  - **Estimated Improvement**: 30% reduction in image transfer size
  - **Difficulty**: Easy (2 minutes)
  - **Priority**: P2

  ### Issue 15 — MEDIUM
  **No blur placeholder for product images**

  - **Location**: All product `Image` components
  - **Root Cause**: Local images in `/public/` and Cloudinary images don't use `placeholder="blur"` with `blurDataURL`. This causes layout instability as images load (cumulative layout shift).
  - **Performance Impact**: **MEDIUM**. Product cards and the product detail page may experience layout shift as images load. Especially impactful on slower connections.
  - **Recommended Fix**: 
    1. For static images (hero): import them to get the blurDataURL automatically
    2. For dynamic images (Cloudinary): use a low-quality placeholder or the dominant color from the product's gradient
  - **Estimated Improvement**: Reduced CLS, improved perceived performance
  - **Difficulty**: Medium (1-2 hours)
  - **Priority**: P2

  ### Issue 16 — LOW-MEDIUM
  **No caching headers on API responses**

  - **Location**: All API routes in `src/app/api/`
  - **Root Cause**: API responses use `NextResponse.json()` without any cache-control headers.
  - **Performance Impact**: **LOW-MEDIUM**. Product listing and category APIs are called frequently (search, filter, navigation). Without caching, every request hits the service layer.
  - **Recommended Fix**: Add `Cache-Control` headers to GET endpoints (products, categories, reviews). For example: `ok(data, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } })`.
  - **Estimated Improvement**: Fewer redundant data fetches
  - **Difficulty**: Easy (15 minutes)
  - **Priority**: P3

  ### Issue 17 — LOW-MEDIUM
  **No rate limiting on API routes**

  - **Location**: All API routes
  - **Root Cause**: No rate limiting middleware is configured. Public endpoints (`/api/cart`, `/api/coupons/validate`, `/api/contact`) are vulnerable to abuse.
  - **Performance Impact**: **LOW-MEDIUM**. Under normal traffic, no impact. Under abnormal traffic (bot, scrapers), API routes could become overwhelmed.
  - **Recommended Fix**: Add rate limiting via middleware or Vercel WAF rules.
  - **Estimated Improvement**: Protection against abusive traffic
  - **Difficulty**: Medium (1-2 hours)
  - **Priority**: P3

  ### Issue 18 — LOW
  **Duplicate animation keyframes in tailwind.config.ts and globals.css**

  - **Location**: `tailwind.config.ts:76-133` and `src/app/globals.css:57-101`
  - **Root Cause**: `wordDrift` and `letterIn` keyframes are defined in BOTH `tailwind.config.ts` (as Tailwind animations) and `globals.css` (as raw CSS). The `animate-letterIn` utility in globals.css may conflict with Tailwind's version.
  - **Performance Impact**: **LOW**. Minor CSS duplication, no measurable impact.
  - **Recommended Fix**: Consolidate all keyframes in `tailwind.config.ts` only. Remove duplicate CSS from `globals.css`.
  - **Difficulty**: Easy (15 minutes)
  - **Priority**: P3

  ### Issue 19 — LOW
  **`Navbar` scroll listener fires on every scroll event**

  - **Location**: `src/components/layout/navbar.tsx:20-23`
  - **Root Cause**: The scroll event listener calls `setVisible()` on every scroll event, which triggers a React state update and re-render. While the passive flag helps, the state update still causes the `motion.header` to re-evaluate.
  - **Performance Impact**: **LOW**. The scroll handler is simple and passive. Only becomes noticeable on low-end devices during fast scrolling.
  - **Recommended Fix**: Use a `useCallback` for the handler and consider a `throttle` or `IntersectionObserver` instead.
  - **Difficulty**: Easy (15 minutes)
  - **Priority**: P3

  ### Issue 20 — LOW
  **No `loading="lazy"` for below-fold product images**

  - **Location**: `src/components/products/product-card.tsx:70-76`
  - **Root Cause**: Product card images don't explicitly set `loading="lazy"` (though Next.js defaults to lazy for non-priority images).
  - **Performance Impact**: **LOW**. Next.js defaults to lazy loading for `fill` images without `priority`. However, hero images already use `priority`.
  - **Recommended Fix**: Explicitly add `loading="lazy"` to product grid images for clarity.
  - **Difficulty**: Easy (5 minutes)
  - **Priority**: P4

  ---

  ## Bundle Size Analysis

  | Bundle | Size (kB) | Notes |
  |---|---|---|
  | First Load JS shared | 102 kB | Includes framer-motion, lucide-react, zustand, radix |
  | Homepage total | 169 kB | Hero + 4 sections + animations |
  | Shop page total | 163 kB | Filters + product grid + search |
  | Product page | 189 kB | Detail + reviews + related products |
  | Checkout page | 182 kB | Form + payment + cart |
  | Cart page | 157 kB | Cart display |
  | Admin dashboard | 106 kB | Minimal (mostly server components) |
  | Admin products | 118 kB | Table + form |
  | Admin orders | 142 kB | Table with status updates |

  **Key bundle observations**:
  - `framer-motion` is the single largest dependency (~32 kB min+gzip)
  - `lucide-react` is tree-shaken via `optimizePackageImports` (good)
  - `radix-ui` primitives are individually imported (could be tree-shaken better)
  - React Hook Form + Zod add ~15 kB to checkout page
  - The 102 kB shared baseline is high for a content-focused site

  ---

  ## Critical Findings Summary

  ### Must Fix (P0)
  1. **Client boundary issue**: `SiteChrome` wrapping forces full client hydration — restructure layout
  2. **Google Fonts blocking render**: Switch to `next/font` for self-hosted, optimized delivery

  ### Should Fix (P1)
  3. `AmbientBackground` runs on every page with expensive blur animations
  4. Hero component has 5+ concurrent animation systems
  5. `Magnetic` used 7+ times with spring physics
  6. `Reveal` creates 10+ IntersectionObservers on homepage

  ### Good to Fix (P2)
  7. Lazy-load `QuickViewModal`, `CartDrawer`, `MobileNav` via next/dynamic
  8. Fix N+1 query pattern in CartService.price()
  9. Reduce StatsStrip rAF count-up overhead
  10. Fix Zustand selector patterns in CartDrawer, ProductCard
  11. Add React.memo to frequently re-rendered components
  12. Enable AVIF image format
  13. Add blur placeholders for product images

  ### Nice to Have (P3-P4)
  14. Caching headers on API responses
  15. Rate limiting
  16. Consolidate duplicate animation keyframes
  17. Explicit lazy loading attributes

  ---

  ## Quick Wins (Under 30 Minutes)

  | # | Fix | Time | Impact |
  |---|---|---|---|
  | 1 | Switch Google Fonts to `next/font` | 15 min | FCP ↓ 200-400ms |
  | 2 | Add `images.formats: ['avif', 'webp']` to config | 2 min | Image size ↓ 30% |
  | 3 | Dynamic import `QuickViewModal`, `CartDrawer`, `MobileNav` | 20 min | JS ↓ 15-25 kB |
  | 4 | Fix Zustand selectors in `CartDrawer` | 10 min | Re-renders ↓ |
  | 5 | Replace `for...of` with batch query in CartService | 30 min | API latency ↓ 50% |
  | 6 | Disable ambient animations on `prefers-reduced-motion` | 15 min | Mobile perf ↑ |
  | 7 | Remove duplicate keyframes from globals.css | 15 min | CSS ↓ 1 kB |

  ## Medium Improvements (1-3 Hours)

  | # | Fix | Time | Impact |
  |---|---|---|---|
  | 1 | Restructure SiteChrome server/client boundary | 2-4 hrs | JS ↓ 40-60% per page |
  | 2 | Reduce Hero animation complexity | 2-3 hrs | Main-thread work ↓ 20% |
  | 3 | Reduce Magnetic usage, replace with CSS | 1 hr | Animation overhead ↓ 30% |
  | 4 | Add React.memo to ProductCard, CategoryCard | 1 hr | Re-renders ↓ 90% |
  | 5 | Add blur placeholders for product images | 1-2 hrs | CLS ↓ |

  ## Major Improvements (1-3 Days)

  | # | Fix | Time | Impact |
  |---|---|---|---|
  | 1 | Full client component audit and server component migration | 2-3 days | JS bundle ↓ 50%+ |
  | 2 | Framer Motion audit — replace with CSS animations where possible | 1-2 days | Bundle size ↓ 32 kB |
  | 3 | API caching strategy with stale-while-revalidate | 1 day | API latency ↓ |

  ---

  ## Estimated Performance Gain

  | Metric | Current | After Optimization | Improvement |
  |---|---|---|---|
  | First Load JS (shared) | 102 kB | 55-70 kB | 30-45% ↓ |
  | Homepage total JS | 169 kB | 90-120 kB | 30-45% ↓ |
  | FCP | ~2.5s (estimate) | ~1.5s | 40% ↓ |
  | LCP | ~3.8s (estimate) | ~2.2s | 42% ↓ |
  | TTI | ~4.2s (estimate) | ~2.5s | 40% ↓ |
  | TBT | ~350ms (estimate) | ~150ms | 57% ↓ |
  | Lighthouse Performance | ~65 (estimate) | ~92 | 27 points ↑ |
  | CLS | ~0.15 (estimate) | ~0.05 | 66% ↓ |

  ---

  ## Optimization Roadmap

  ### Phase 1 — Critical (Day 1)
  - Switch to `next/font` for Google Fonts
  - Restructure `SiteChrome` server/client boundary
  - Dynamic import of heavy overlay components (CartDrawer, MobileNav, QuickViewModal)

  ### Phase 2 — High (Day 2-3)
  - Reduce hero animation complexity
  - Replace `Magnetic` instances with CSS transitions
  - Consolidate `Reveal` IntersectionObservers
  - Disable ambient animations for reduced motion
  - Fix N+1 query pattern
  - Fix Zustand selector patterns

  ### Phase 3 — Medium (Day 4-5)
  - Add React.memo to frequently re-rendered components
  - Enable AVIF image format
  - Add blur placeholders
  - Add caching headers to API routes
  - Remove duplicate animation keyframes

  ### Phase 4 — Optional (Day 6+)
  - Rate limiting
  - Full framer-motion audit
  - Image CDN optimization
  - Service worker for offline support
  - Bundle analysis and code splitting

  ---

  ## Appendix: Component Client/Server Map

  | Component | Current | Should Be | Reason |
  |---|---|---|---|
  | RootLayout | Server | Server | ✅ Correct |
  | SiteChrome | **Client** | **Split**: server shell + client portal | BAD — forces full page hydration |
  | Navbar | Client | Client (needs scroll listener) | OK, but dynamic import |
  | NavShell | Client | Client (needs zustand) | OK |
  | MobileNav | Client | Client (needs zustand) | OK, but dynamic import |
  | CartDrawer | Client | Client (needs zustand) | OK, but dynamic import |
  | Footer | **Client** | **Server** (only newsletter needs client) | Over-clientified |
  | AmbientBackground | **Static (no directive)** | Server | OK, but CSS animations heavy |
  | Hero | Client | Client (animations) | OK, but too many animations |
  | CategorySection | **Client** | **Server** (no interactivity) | Over-clientified |
  | StatsStrip | **Client** | **Server** (count-up can be deferred) | Unnecessary client |
  | TrendingMarquee | **Client** | **Server** | No interactivity needed |
  | BestsellerSection | Server | Server | ✅ Correct |
  | ProductGrid | **Client** | **Server** (motion can be CSS) | Over-clientified |
  | ProductCard | Client | Client (needs zustand) | OK, but memo needed |
  | ShopFilters | Client | Client (interactive) | OK |
  | Reveal | **Client** | Server with CSS animation | Over-clientified |
  | Magnetic | Client | Replace with CSS | When possible |
  | ProductDetail | Client | Client (interactive) | OK |
  | ProductReviews | **Client** | **Server** with client form | Partially fixable |
  | SearchClient | Client | Client (interactive) | OK |
  | CheckoutClient | Client | Client (payment) | OK |
  | QuickViewModal | Client | Client | OK, but dynamic import |

  **Summary**: 12 of 22 components are unnecessarily client-rendered or could be partially server-rendered.
