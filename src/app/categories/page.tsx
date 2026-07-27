import type { Metadata } from "next";
import { CategoryService } from "@/lib/services/category.service";
import { CategorySection } from "@/components/home/category-section";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Shop by occasion",
  description: "Find the perfect gift for every moment — birthdays, anniversaries, weddings and more.",
};

export default async function CategoriesPage() {
  const categories = await CategoryService.list();

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-16 md:px-8">
      <PageHeader
        eyebrow="Occasions"
        title="A gift for every moment"
        subtitle="However you want to say it, we've wrapped the perfect thing to match."
      />
      <div className="mt-4">
        <CategorySection categories={categories} />
      </div>
    </div>
  );
}
