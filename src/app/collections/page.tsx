import type { Metadata } from "next";
import Link from "next/link";
import { CollectionService } from "@/lib/services/collection.service";
import { PageHeader } from "@/components/shared/page-header";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore our curated gift collections — thoughtfully wrapped for every occasion.",
};

export default async function CollectionsPage() {
  const collections = await CollectionService.list();

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-16 md:px-8">
      <PageHeader
        eyebrow="Curated"
        title="Our collections"
        subtitle="Hand-picked gift sets for every story worth telling."
      />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.filter((c) => c.isActive).map((collection) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.slug}`}
            className="group relative overflow-hidden rounded-[26px] bg-white p-8 shadow-soft transition hover:-translate-y-1 hover:shadow-pop"
          >
            <div className="flex flex-col gap-3">
              <h3 className="font-display text-2xl font-bold text-ink">
                {collection.name}
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                {collection.description}
              </p>
              <span className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand">
                Explore collection <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}