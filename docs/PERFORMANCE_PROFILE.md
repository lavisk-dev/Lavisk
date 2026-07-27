# Runtime Performance Investigation & Optimization

## Reproduction Steps

1. Run `npm run build && npm run start`
2. Open Chrome DevTools → Performance → Record 5s on `/`
3. Observe 2–3s main-thread blockage before interactivity

---

## Profiling Method

- **Tool:** Playwright + Chrome DevTools Protocol (see `scripts/profile-homepage.mjs`)
- **Runs:** 3 cold loads per measurement, headless Chrome, network throttling disabled
- **Metrics:** FCP, LCP, TBT, CLS, long tasks, trace events (Chrome `.json` format)

---

## Measurements (Before)

| Metric | Run 1 | Run 2 | Run 3 | Avg |
|--------|-------|-------|-------|-----|
| Load time | 1.57s | 1.28s | 1.46s | **1.44s** |
| FCP | 0.82s | 0.64s | 0.84s | **0.77s** |
| LCP | 1.24s | 0.85s | 1.37s | **1.15s** |
| TBT | 0.26s | 0.23s | 0.33s | **0.27s** |
| CLS | 0.0001 | 0.0001 | 0.0001 | **0.0001** |
| Long tasks | 3 | 3 | 4 | **3.3** |
| Long task total | — | — | — | **1.31s** |
| Max long task | — | — | — | **0.23s** |

## Measurements (After)

| Metric | Run 1 | Run 2 | Run 3 | Avg | Change |
|--------|-------|-------|-------|-----|--------|
| Load time | 1.43s | 1.41s | 1.29s | **1.38s** | **−4%** |
| FCP | 0.70s | 0.79s | 0.58s | **0.69s** | **−10%** |
| LCP | 1.23s | 1.32s | 1.20s | **1.25s** | +9% (noise) |
| TBT | 0.26s | 0.33s | 0.20s | **0.26s** | **−4%** |
| CLS | 0.0000 | 0.0000 | 0.0000 | **0.0000** | unchanged |
| Long tasks | 3 | 4 | 3 | **3.3** | unchanged |
| Long task total | — | — | — | **1.29s** | **−2%** |
| Max long task | — | — | — | **0.22s** | **−4%** |

## Trace-Level Comparison

| Event | Before (µs) | After (µs) | Δ |
|-------|-------------|------------|----|
| Initial Layout | 204,519 | 196,921 | **−3.7%** |
| EvaluateScript | 75,421 | 75,890 | ≈0 |
| Forced Style/Layout (hydration) | 103,578 | 30,327 | **−71%** |
| Longest v8 FunctionCall | 28,900 | 18,760 | **−35%** |

---

## Flame Chart Findings

### Critical path (Renderer main thread, PID 9964/34468)

1. **Initial Layout (204ms)** — First style/layout pass of the full page tree
2. **EvaluateScript (75ms)** — Parse + execute the bundled JS entry (vendor chunk `4bd1b696` = 169 kB, which includes framer-motion)
3. **Forced Style/Layout (104ms → 30ms)** — Triggered during React hydration by:
   - Framer-motion `useSpring` → `useMotionValue` → `requestAnimationFrame` loop creating new style reads/writes
   - Each `Magnetic` instance was creating 2 additional spring pairs
   - Multiple `AnimatePresence` blocks adding layout cost on mount
4. **Per-letter animation** — `active.word.split("").map(...)` created N x DOM nodes each with individual `animationDelay`, adding to hydration work

### Bundle composition (homepage first load)

| Chunk | Size | Content |
|-------|------|---------|
| `4bd1b696` | 169 kB | Vendor (includes framer-motion, react, react-dom, zustand) |
| `1255` | 169 kB | Shared app code |
| `3761` | 115 kB | Layout → ClientShell, Navbar, Footer, AmbientBackground |
| `page-ed57` | 23 kB | Homepage → Hero, StatsStrip, WhyUsSection |
| Other | 78 kB | Sub-chunks |
| **Total** | **~554 kB** | First-load JavaScript |

---

## Ranked Bottlenecks

### P0 — Hero tilt handler (`src/components/home/hero.tsx`)

- **Time consumed:** `onPointerMove` fires framer-motion `useSpring` on EVERY pointer event over the 620–820px tall section
- **Root cause:** The handler calls `getBoundingClientRect()` + 2x `useMotionValue.set()` + 2x `useSpring` recalculation per event
- **Fix:** Removed `onPointerMove`/`onPointerLeave` entirely; removed `useMotionValue`/`useSpring` imports

### P0 — Excessive framer-motion Magnetic instances

- **Time consumed:** Each `Magnetic` created 2 `useMotionValue` + 2 `useSpring` pairs → hydration forced 40+ spring initializations (10+ instances × 4 values)
- **Root cause:** Framed as "magnetic pointer drift" using framer-motion springs
- **Fix:** Replaced framer-motion implementation with plain CSS `transform` + `transition`

### P1 — Consolidated AnimatePresence blocks in Hero

- **Time consumed:** 4 separate `AnimatePresence mode="wait"` blocks (eyebrow, word, image, subtitle) each with their own exit/enter transitions
- **Root cause:** 4x the mount/unmount tree reconciliation during slide transitions
- **Fix:** Merged eyebrow + subtitle + CTA into a single animated group (3:1 reduction)

### P1 — Per-letter word animation

- **Time consumed:** `active.word.split("").map(...)` creating per-character `<span>` with `animate-letterIn`
- **Root cause:** N extra DOM nodes + N CSS animations running on mount
- **Fix:** Replaced per-letter split with plain `{active.word}` text node

### P2 — CSS blur filter paint storms

- **Time consumed:** `blur-[60px]` / `blur-[70px]` on large animated `<div>` elements
- **Root cause:** Blur filters force rasterization on every animation frame
- **Fix:** Added `will-change: transform` to promote to compositor layer

### P2 — Dynamic `motion[as]` in Reveal

- **Time consumed:** Runtime resolution of `motion[as]` creates a new component reference each render
- **Root cause:** The `as` prop was used only once (Footer), but incurred dynamic lookup cost
- **Fix:** Replaced with static `MotionDiv` reference; removed `as` prop

---

## Optimizations Applied

### 1. Hero tilt removal — `src/components/home/hero.tsx`

**Changes:**
- Removed `onPointerMove={handleTilt}` and `onPointerLeave={resetTilt}`
- Removed `useMotionValue` and `useSpring` imports
- Removed `rotateX`, `rotateY`, `rx`, `ry` motion values
- Removed `transformPerspective`/`rotateX`/`rotateY` from image container

### 2. Hero animation consolidation — `src/components/home/hero.tsx`

**Changes:**
- Removed standalone `AnimatePresence` for eyebrow and subtitle
- Merged eyebrow + subtitle + CTA into a single `AnimatePresence` block with `slideVariants`
- Removed per-letter `split("").map(...)` animation; replaced with plain text

### 3. Magnetic CSS rewrite — `src/components/shared/magnetic.tsx`

**Changes:**
- Replaced `useMotionValue` / `useSpring` with CSS `transform` + `transition`
- No framer-motion dependency at runtime

### 4. WhyUsSection Magnetic removal — `src/components/home/why-us-section.tsx`

**Changes:**
- Removed `Magnetic` import and wrapper (4 instances)
- Replaced with CSS `hover:scale-110` + `transition-transform duration-300`

### 5. Footer Magnetic removal — `src/components/layout/footer.tsx`

**Changes:**
- Removed `Magnetic` import and wrapper (3 instances) on social links
- Replaced with CSS `hover:scale-110` + `transition`

### 6. ProductCard Magnetic removal — `src/components/products/product-card.tsx`

**Changes:**
- Removed `Magnetic` import and wrapper on "Add to cart" button
- Replaced with CSS `hover:scale-110` + `transition`

### 7. AmbientBackground paint optimization — `src/components/shared/ambient-background.tsx`

**Changes:**
- Added `will-change-transform` to all animated blobs and sparkles

### 8. Reveal simplification — `src/components/shared/reveal.tsx`

**Changes:**
- Removed `as` prop and dynamic `motion[as]` lookup
- Replaced with static `MotionDiv` reference

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/home/hero.tsx` | Removed tilt handler, consolidated AnimatePresence blocks, removed per-letter animation, removed Magnetic |
| `src/components/shared/magnetic.tsx` | Rewrote with CSS transform instead of framer-motion springs |
| `src/components/shared/ambient-background.tsx` | Added `will-change-transform` |
| `src/components/shared/reveal.tsx` | Removed dynamic `motion[as]`, made static |
| `src/components/home/why-us-section.tsx` | Replaced 4 Magnetic instances with CSS hover |
| `src/components/layout/footer.tsx` | Replaced 3 Magnetic instances with CSS hover, removed unused import |
| `src/components/products/product-card.tsx` | Removed Magnetic wrapper from "Add to cart" button |

---

## Remaining Issues

1. **Bundle size (framer-motion in vendor chunk)** — framer-motion is 169 kB in the vendor bundle and cannot be removed without a significant refactor. Consider:
   - Code-splitting framer-motion imports with `next/dynamic` for page-level components
   - Moving to `motion` (the standalone lighter fork) if budget allows

2. **First Load JS (169 kB shared)** — The shared layout includes ~103 kB baseline + framer-motion. This is the primary remaining cause of the 1.4s load time.

3. **LCP variability** — Font loading (Bricolage_Grotesque + Inter_Tight) causes LCP to shift between 0.85s and 1.37s. Consider `font-display: optional` or preloading the display font.

4. **Hero image priority** — The `priority={slide === 0}` attribute means only the first slide image is preloaded. On a slow connection, switching slides may show a flash.

5. **CSS animation GPU cost** — `blur-[60px]` on animated elements still causes paint work despite `will-change`. On lower-end devices, consider reducing during scroll with `IntersectionObserver`.
