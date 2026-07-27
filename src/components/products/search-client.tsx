"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";

export function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&pageSize=48`);
      const json = await res.json();
      if (json.success) setResults(json.data.products);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search on input + keep the URL query in sync.
  useEffect(() => {
    const t = setTimeout(() => {
      runSearch(query);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }, 320);
    return () => clearTimeout(t);
  }, [query, runSearch, router]);

  return (
    <div>
      <div className="relative mt-8 max-w-2xl">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for flowers, chocolate, keepsakes…"
          aria-label="Search gifts"
          className="h-14 w-full rounded-full border border-border bg-white pl-14 pr-6 text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>

      <div className="mt-10">
        {loading && <p className="text-muted">Searching…</p>}
        {!loading && searched && results.length > 0 && (
          <p className="mb-5 text-sm text-muted">
            {results.length} {results.length === 1 ? "result" : "results"} for “{query}”
          </p>
        )}
        {!loading && searched && results.length > 0 && (
          <ProductGrid products={results} quickView columns={3} />
        )}
        {!loading && searched && results.length === 0 && (
          <div className="mt-10 rounded-[28px] bg-white px-6 py-16 text-center shadow-soft">
            <div className="mb-3 text-4xl">🔍</div>
            <p className="font-display text-xl font-bold">No gifts found</p>
            <p className="mt-2 text-muted">
              We couldn&apos;t find anything for “{query}”. Try a different search term.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/shop">Browse all gifts</Link>
              </Button>
            </div>
          </div>
        )}
        {!searched && (
          <div className="mt-10 rounded-[28px] bg-white px-6 py-16 text-center shadow-soft">
            <div className="mb-3 text-4xl">🎁</div>
            <p className="font-display text-xl font-bold">Find the perfect gift</p>
            <p className="mt-2 text-muted">Type above to search flowers, chocolate, keepsakes and more.</p>
          </div>
        )}
      </div>
    </div>
  );
}
