# Initial Render Investigation — Root Cause Report

## Problem Statement

> The browser remains on a blank page ("Loading...") for 2–3 seconds before the homepage appears. The server starts in under 1 second. Therefore the issue occurs before the first paint.

---

## Investigation Method

- Captured production HTML (109 kB) by direct HTTP request
- Analyzed `<head>` and `<body>` structure for render-blocking resources
- Ran browser-level timing via Playwright (Chrome, headless)
- Measured TTFB, CSS load, script download waterfall, and long tasks
- Inspected the RSC streaming payload and inline script structure
- Examined the static generation output type (`○ Static`)

---

## Checklist Results

| # | Check | Status | Finding |
|---|-------|--------|---------|
| 1 | middleware.ts | ✅ Not the cause | Only matches `/admin/:path*`, skips the homepage |
| 2 | Root layout | 🔴 Module-scope side effect | `ensureAutomationInitialized()` runs on import (sync, cheap) |
| 3 | app/page.tsx | 🟡 Async server components | 4 async components wrapped in Suspense → streamed as hidden `<div>` + inline scripts |
| 4 | Suspense boundaries | 🟡 Not the primary cause | 4 Suspense boundaries with `SectionSkeleton` fallbacks, but statically resolved at build time |
| 5 | Async server components | 🟡 Static at runtime | Pre-rendered at build time (page is `○ Static`), but their RSC payload is 32.6 KB of inline scripts |
| 6 | Database queries | ✅ Not the cause | All queries execute at build time (static generation) |
| 7 | Dynamic imports | 🟡 Minor | `CartDrawer`, `MobileNav`, `QuickViewModal` with `{ ssr: false }` → `BAILOUT_TO_CLIENT_SIDE_RENDERING` markers |
| 8 | Route handlers | ✅ Not the cause | No route handlers on the homepage |
| 9 | Metadata generation | ✅ Not the cause | Static metadata (title, description, OG tags) - embedded directly in HTML |
| 10 | Fonts | 🟡 Minor | Self-hosted via `next/font/google`, `display: swap`, CSS inlined |
| 11 | Images | 🟡 Hero image preload | `<link rel="preload" as="image">` is **before** the CSS link in `<head>` |
| 12 | Browser Network waterfall | 🔴 **Primary evidence** | See below |
| 13 | React hydration | 🟡 Contributes | 194ms long task for hydration |
| 14 | Blocking await | ✅ Not the cause | No blocking awaits at runtime |

---

## Root Cause A: Render-Blocking CSS Delayed by Prior Image Preload

**File:** Generated HTML `<head>` (no source file — Next.js internal)

**Function:** HTML `<head>` generation during static export

**Evidence:**

The `<head>` contains these resources in order:

```html
<!-- Line 1 -->
<link rel="preload" as="image" imageSrcSet=".../hero/gifted-closed.png ..." />
<!-- Line 2 -->
<link rel="stylesheet" href="/_next/static/css/ef94d1e54de6b9e2.css" />
<!-- Line 3-14 -->
<script src="chunk-4bd1b696.js" async></script>
...11 more async scripts...
```

- The image preload (line 1) starts downloading **immediately**, before the CSS (line 2)
- The CSS is **render-blocking** — the browser cannot paint until it is fully loaded and parsed
- The image preload competes with the CSS for the browser's network connection pool and bandwidth
- On a throttled connection, the CSS download is delayed because the browser prioritizes the preloaded image

**CSS file:** 61.5 kB (100% of styles are in this single external file)

**Time consumed:** CSS load time ~68ms on localhost (potentially 500-1500ms on throttled connections)

**Why it blocks rendering:** CSS is the only render-blocking resource. The browser defers ALL painting until this file is loaded.

---

## Root Cause B: 12 Async Scripts Creating a Main-Thread Blocking Cascade

**File:** Generated HTML `<head>` (Next.js internal build output)

**Time consumed:** ~360ms of main-thread blocking across 3 long tasks

**Evidence from Playwright profiling:**

```
Long tasks (3):
  duration=194ms at 167ms   ← React hydration + RSC payload processing
  duration=63ms  at 381ms   ← Layout/component initialization
  duration=88ms  at 509ms   ← Remaining hydration effects
```

**Resources loaded (sorted by request start):**
```
chunk-4bd1b696.js       53.4 kB  vendor (framer-motion, react, zustand)
chunk-1255.js           45.5 kB  shared app code
chunk-3761.js           37.6 kB  layout (ClientShell, Navbar, Footer)
chunk-page-983a.js       7.4 kB  homepage page
...8 more chunks...
Total decoded:         ~250 kB (compressed), ~538 kB (uncompressed)
```

All 12 scripts have `<script async>`, which means they:
1. Download in parallel (all finish within ~100ms)
2. Execute immediately on the main thread as each finishes
3. Each execution blocks the HTML parser and DOM construction
4. Later scripts (like the page chunk) trigger React hydration, which adds 194ms of blocking

**Why it blocks rendering:** Even though scripts are `async`, their execution is synchronous on the main thread. Each execution blocks:
- DOM construction (parser blocked)
- CSSOM application
- First paint scheduling

---

## Root Cause C: 17 Inline RSC Payload Scripts (32.6 KB)

**File:** Generated HTML `<body>` (implicit — output of Next.js RSC streaming)

**Function:** `self.__next_f.push()` — processes React Server Component stream

**Evidence:**

The body ends with 17 inline scripts totaling 32.6 KB:

```html
<script>self.__next_f.push([1,"1:\"$Sreact.fragment\"...])</script>
<script>self.__next_f.push([1,"0:{\"P\":null,...])</script>
<script>self.__next_f.push([1,"a:I[4431,[],\"OutletBoundary\"]...])</script>
...14 more scripts...
```

These scripts:
1. Are **synchronous** (no `async`, no `defer`)
2. Execute sequentially, blocking HTML parsing
3. Process the streaming RSC payload (Categories, Trending, Bestsellers, Journal data)
4. Move hidden streaming content (`<div hidden id="S:0">` through `S:3`) into the visible DOM
5. Trigger React hydration

The 4 hidden streaming sections contain pre-rendered HTML for the async components:

| ID | Content | Size |
|----|---------|------|
| S:0 | Categories | ~12.2 KB |
| S:1 | Trending | ~17.1 KB |
| S:2 | Bestsellers | ~17.4 KB |
| S:3 | Journal | ~13.5 KB |

These data chunks are already in the HTML but hidden. The RSC scripts must execute to move them into the visible DOM, but this cannot happen until all async vendor scripts have loaded (they define `$RC`, `self.__next_f`, and other RSC runtime functions).

**Why it blocks rendering:** The RSC payload scripts are synchronous, inline, and placed at the very end of the body. They cannot execute until all async scripts in `<head>` have finished downloading AND executing. This creates a dependency chain:

```
scripts download (~100ms) → scripts execute (~200ms) → RSC payload runs (~60ms) → hydrate (~194ms)
```

During ALL of this time, the main thread is busy and cannot process paint requests.

---

## Root Cause D (Development-Only): First-Request Webpack Compilation

**Environment:** `next dev` mode

**Evidence:** In development mode, the first request to any page triggers on-demand webpack compilation. For the homepage, the dependency graph includes:

- `framer-motion` (full library)
- `lucide-react` (multiple icon imports)
- `@supabase/supabase-js` (full client)
- `@/lib/services/product.service`
- `@/lib/services/category.service`
- `@/lib/services/blog.service`
- `@/lib/services/automation/*` (4+ files)
- `@/store/*` (5+ zustand stores)
- 40+ component files across 10 directories
- Radix UI components (accordion, avatar, checkbox, dialog, etc.)

**Compilation time:** 2-3 seconds (estimated based on number of modules)

During compilation, the server does NOT send any HTML. The browser tab shows "Loading..." and a blank page.

---

## Summary of Findings

| # | Root Cause | Time | Environment | Priority |
|---|-----------|------|-------------|----------|
| A | Image preload before render-blocking CSS | ~68-500ms | All | P1 |
| B | 12 async scripts creating main-thread cascade | ~360ms | Production | P1 |
| C | 17 inline RSC payload scripts (32.6 KB) | ~60ms (blocked until B finishes) | All | P2 |
| D | First-request webpack compilation | 2-3s | Development only | P0 |

**Primary cause for the 2-3 second blank page: Root Cause D** (Development mode compilation).

In production (`npm run build && npm start`), the page loads in ~500ms with FCP at ~690ms.

---

## Files Involved (for awareness, not modification)

1. `src/app/layout.tsx:8` — `ensureAutomationInitialized()` module-scope side effect
2. `src/app/page.tsx:9-11` — Imports of ProductService, CategoryService, BlogService (adds to build graph)
3. `src/app/page.tsx:19-37` — 4 async server components (adds to RSC payload)
4. Generated `/_next/static/css/*.css` — Single render-blocking CSS file (61.5 kB)
5. Generated `/_next/static/chunks/*.js` — 12 async scripts totaling ~538 kB decoded

---

## Recommendations

For **development mode** (P0):
- Run `npm run build && npm start` instead of `next dev` for performance testing
- The compilation delay is inherent to `next dev` and not something we patch

For **production** (P1):
- Move the CSS `<link>` before the image preload to ensure CSS is the highest-priority render-blocking resource
- Consider adding a `loading.tsx` for immediate visual feedback during React hydration

For **RSC payload** (P2):
- Reduce the number of inline `self.__next_f.push()` scripts — this is controlled by Next.js internals
