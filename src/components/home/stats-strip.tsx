"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { revealUp, viewportOnce } from "@/lib/utils/motion";

const STATS = [
  { target: 128400, suffix: "+", label: "Gifts wrapped & sent", decimals: 0 },
  { target: 4.9, suffix: "★", label: "Average customer rating", decimals: 1 },
  { target: 52, suffix: "", label: "Cities we deliver to", decimals: 0 },
];

function useCountUp(target: number, decimals: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const duration = 1700;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);

  if (decimals > 0) return value.toFixed(decimals);
  return Math.round(value).toLocaleString();
}

function Stat({ stat, active }: { stat: (typeof STATS)[number]; active: boolean }) {
  const display = useCountUp(stat.target, stat.decimals, active);
  return (
    <motion.div
      variants={revealUp}
      className="rounded-[24px] bg-white px-8 py-7 text-center shadow-soft"
    >
      <div className="font-display text-[44px] font-extrabold leading-none tracking-[-0.02em] text-brand">
        {display}
        {stat.suffix}
      </div>
      <div className="mt-2 text-sm font-medium tracking-[0.02em] text-muted">{stat.label}</div>
    </motion.div>
  );
}

export function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, viewportOnce);

  return (
    <motion.div
      ref={ref}
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-3"
    >
      {STATS.map((stat) => (
        <Stat key={stat.label} stat={stat} active={inView} />
      ))}
    </motion.div>
  );
}
