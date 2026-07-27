"use client";

import { motion } from "framer-motion";
import { Truck, Gift, Lock, Sparkles, type LucideIcon } from "lucide-react";
import { BRAND_NAME, WHY_US_FEATURES } from "@/lib/constants";
import { revealUp, staggerContainer, viewportOnce } from "@/lib/utils/motion";

const ICONS: Record<string, LucideIcon> = {
  truck: Truck,
  gift: Gift,
  lock: Lock,
  sparkles: Sparkles,
};

const DURATIONS = ["7s", "8s", "8.6s", "7.4s"];

export function WhyUsSection() {
  return (
    <section id="why" className="mt-14 scroll-mt-24 rounded-[32px] bg-brand-blush px-6 py-13 md:mt-16 md:px-10 md:py-14">
      <motion.h2
        variants={revealUp}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mb-10 text-center font-display text-[clamp(28px,3.8vw,42px)] font-bold tracking-[-0.03em]"
      >
        Why gift with {BRAND_NAME}
      </motion.h2>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-4"
      >
        {WHY_US_FEATURES.map((feature, i) => {
          const Icon = ICONS[feature.icon];
          return (
            <motion.div
              key={feature.title}
              variants={revealUp}
              className="rounded-[24px] bg-white px-6 py-8 text-center shadow-soft"
            >
              <div className="mx-auto mb-4.5 block w-fit transition-transform duration-300 hover:scale-110">
                <div
                  className="flex h-[70px] w-[70px] animate-floatY items-center justify-center rounded-[22px]"
                  style={{ background: feature.bg, animationDuration: DURATIONS[i] }}
                >
                  <div className="animate-ribbon">
                    <Icon className="h-7 w-7 text-brand" />
                  </div>
                </div>
              </div>
              <div className="font-display text-[19px] font-bold">{feature.title}</div>
              <div className="mt-1.5 text-sm leading-relaxed text-muted">{feature.desc}</div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
