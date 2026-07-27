"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
];

export function ShopFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "";
  const activeSort = searchParams.get("sort") ?? "newest";

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setParam("category", "")}
          className={cn(
            "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
            !activeCategory ? "bg-brand text-white" : "bg-white text-muted hover:text-ink"
          )}
        >
          All gifts
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setParam("category", c.slug)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
              activeCategory === c.slug
                ? "bg-brand text-white"
                : "bg-white text-muted hover:text-ink"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="sort" className="text-sm font-medium text-muted">
          Sort
        </label>
        <select
          id="sort"
          value={activeSort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
