"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import type { Category } from "@/lib/types";
import { revealUp } from "@/lib/utils/motion";
import { cn } from "@/lib/utils";

const FLOAT_DURATIONS = ["7s", "8.5s", "9s", "7.6s", "8.2s", "9.4s", "7.9s", "8.8s"];

export function CategoryCard({
  category,
  index,
  large,
}: {
  category: Category;
  index: number;
  large?: boolean;
}) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const rx = useSpring(rotateX, { stiffness: 120, damping: 30 });
  const ry = useSpring(rotateY, { stiffness: 120, damping: 30 });

  const handleTilt = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    rotateX.set(((e.clientY - r.top) / r.height - 0.5) * -3);
    rotateY.set(((e.clientX - r.left) / r.width - 0.5) * 3);
  };
  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      variants={revealUp}
      className={cn(large && "col-span-2")}
    >
      <motion.div
        onPointerMove={handleTilt}
        onPointerLeave={resetTilt}
        style={{ rotateX: rx, rotateY: ry, transformPerspective: 800 }}
        className={cn(
          "group relative overflow-hidden rounded-[26px] transition-shadow duration-300 hover:shadow-[0_26px_50px_-26px_rgba(255,76,130,0.5)]",
          large ? "h-[220px]" : "h-[200px]"
        )}
      >
        <Link
          href={`/categories/${category.slug}`}
          className="relative block h-full w-full p-6"
          style={{
            background: `linear-gradient(150deg, ${category.gradientFrom}, ${category.gradientTo})`,
          }}
        >
          <div className="pointer-events-none absolute inset-0 z-[3] -translate-x-full -translate-y-full bg-[linear-gradient(135deg,transparent_30%,rgba(255,255,255,0.35)_50%,transparent_70%)] opacity-0 transition-all duration-1000 group-hover:translate-x-full group-hover:translate-y-full group-hover:opacity-100" />

          <div
            className="absolute -bottom-6 -right-4 h-[130px] w-[130px] animate-blobMorph"
            style={{
              background: category.blobColor,
              animationDuration: `${FLOAT_DURATIONS[index % FLOAT_DURATIONS.length]}, 18s`,
              animationName: "floatY, blobMorph",
            }}
          />

          <div className="relative z-[2] flex h-full flex-col justify-between">
            <div className="flex justify-end">
              <div className="h-14 w-14 overflow-hidden rounded-full border-[3px] border-white/60 shadow-lg">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${category.gradientFrom}, ${category.blobColor})`,
                    }}
                  />
                )}
              </div>
            </div>
            <div className="font-display text-[22px] font-bold text-ink">
              {category.name}
            </div>
            <div className="mt-0.5 text-[13px] text-muted">{category.count} gifts</div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
