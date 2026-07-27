import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchClient } from "@/components/products/search-client";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Lavisk collection.",
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-16 md:px-8">
      <PageHeader eyebrow="Find it fast" title="Search gifts" />
      <Suspense fallback={<p className="mt-8 text-muted">Loading…</p>}>
        <SearchClient />
      </Suspense>
    </div>
  );
}
