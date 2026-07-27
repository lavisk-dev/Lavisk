"use client";

import { motion } from "framer-motion";
import type { Category } from "@/lib/types";
import { CategoryCard } from "@/components/categories/category-card";
import { Reveal } from "@/components/shared/reveal";
import { staggerContainer, viewportOnce } from "@/lib/utils/motion";

const LARGE_SLUGS = new Set(["birthday", "just-because", "personalized"]);

export function CategorySection({ categories }: { categories: Category[] }) {
  return (
    <section id="categories" className="mt-14 scroll-mt-24 md:mt-16">
      <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-2.5">
        <h2 className="font-display text-[clamp(22px,2.6vw,30px)] font-bold tracking-[-0.03em]">
          Shop by occasion
        </h2>
        <p className="max-w-sm text-sm text-muted">
          A little something for every moment worth marking.
        </p>
      </Reveal>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        {categories.map((category, i) => (
          <CategoryCard
            key={category.id}
            category={category}
            index={i}
            large={LARGE_SLUGS.has(category.slug)}
          />
        ))}
      </motion.div>
    </section>
  );
}
