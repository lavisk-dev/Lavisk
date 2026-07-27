import Link from "next/link";
import type { Product } from "@/lib/types";
import { ProductGrid } from "@/components/products/product-grid";
import { Reveal } from "@/components/shared/reveal";

export function BestsellerSection({ products }: { products: Product[] }) {
  return (
    <section id="bestsellers" className="mt-14 scroll-mt-24 md:mt-16">
      <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <h2 className="font-display text-[clamp(22px,2.6vw,30px)] font-bold tracking-[-0.03em]">
            Our bestsellers
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Wrapped, ribboned and ready to make someone&apos;s whole week.
          </p>
        </div>
        <Link
          href="/shop?sort=rating"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition hover:opacity-70"
        >
          Shop all
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </Reveal>

      <ProductGrid products={products} quickView columns={3} />
    </section>
  );
}
