"use client";

import type { Variants } from "framer-motion";

// Shared, reduced-motion-friendly animation variants used across the
// storefront. Only animate transform + opacity to keep everything at
// 60fps on the GPU.

export const revealUp: Variants = {
  hidden: { opacity: 0, y: 46 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.2, 0.8, 0.2, 1] },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } },
};

export const viewportOnce = { once: true, amount: 0.15 } as const;
