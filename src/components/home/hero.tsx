"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { NavShell } from "@/components/layout/nav-shell";
import { HERO_SLIDES } from "@/lib/constants";

const slideVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function Hero() {
  const [slide, setSlide] = useState(0);
  const active = HERO_SLIDES[slide];

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 6500);
    return () => clearInterval(t);
  }, []);

  const next = () => setSlide((s) => (s + 1) % HERO_SLIDES.length);
  const prev = () => setSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <section className="relative min-h-[620px] overflow-hidden rounded-none bg-[linear-gradient(160deg,#FF4C82_0%,#FF6E97_55%,#FF8FA3_100%)] px-5 pb-0 pt-[22px] shadow-pop md:min-h-[820px] md:rounded-[34px] md:px-10 md:pt-[26px] mx-auto max-w-[1600px] pb-14 md:pb-0"
    >
      {/* Mesh plate — matches the two-blob radial gradient in the source */}
      <div className="pointer-events-none absolute inset-0 animate-meshShift bg-[radial-gradient(40%_50%_at_20%_20%,#FFB6C9,transparent_70%),radial-gradient(40%_50%_at_85%_30%,#FFD3B0,transparent_70%)] opacity-50" />

      {/* Nav row (design lines 63–79) */}
      <div className="relative z-[5]">
        <NavShell tone="light" />
      </div>

      {/* Word + subject group (design line 82) — margin-top:20px after nav */}
      <div className="relative z-[3] mt-5 flex flex-col items-center text-center">
        <div className="relative flex w-full justify-center">
          {/* Oversized background wordmark — z-1, behind image */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`word-${slide}`}
                className="animate-wordDrift whitespace-nowrap font-display font-extrabold leading-[0.82] tracking-[-0.04em] text-[rgba(255,236,242,0.4)]"
                style={{ fontSize: "clamp(80px, 18vw, 210px)" }}
              >
                {active.word}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Hero subject image container */}
          <div className="relative z-[2] mt-[28px] h-[300px] w-[min(460px,85vw)] md:mt-[34px] md:h-[580px] md:w-[min(560px,78vw)]">
            <div className="absolute inset-[6%] animate-floatY">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`image-${slide}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                  className="relative h-full w-full"
                >
                  <Image
                    src={active.image}
                    alt={active.imageAlt}
                    fill
                    priority={slide === 0}
                    sizes="(max-width: 768px) 85vw, 540px"
                    className="object-contain drop-shadow-[0_24px_40px_rgba(150,20,60,0.25)]"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Animated group: eyebrow + subtitle + CTA */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${slide}`}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4 }}
            className="relative z-[3] flex flex-col items-center"
          >
            <div className="mb-1.5 text-base font-semibold uppercase tracking-[0.32em] text-brand-mist">
              {active.eyebrow}
            </div>
            <div className="-mt-5 font-display text-[clamp(24px,4vw,38px)] font-semibold italic text-white [text-shadow:0_2px_20px_rgba(150,20,60,0.3)]">
              {active.subtitle}
            </div>
            <Link
              href="/shop"
              className="mt-[22px] inline-flex animate-ctaPulse items-center gap-2 rounded-[40px] bg-white px-10 py-[17px] font-body text-base font-bold text-brand transition-transform duration-300 hover:-translate-y-0.5 hover:scale-[1.04]"
            >
              Shop the Collection &nbsp;→
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next carousel controls — bottom:28px, sides:40px on desktop */}
      <button
        onClick={prev}
        className="absolute bottom-4 left-6 z-[5] text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-mist opacity-85 transition hover:opacity-100 md:bottom-7 md:left-10"
        aria-label="Previous slide"
      >
        ◀ &nbsp;Previous
      </button>
      <button
        onClick={next}
        className="absolute bottom-4 right-6 z-[5] text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-mist opacity-85 transition hover:opacity-100 md:bottom-7 md:right-10"
        aria-label="Next slide"
      >
        Next &nbsp;▶
      </button>
    </section>
  );
}
