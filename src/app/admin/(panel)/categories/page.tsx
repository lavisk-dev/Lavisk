import { CategoryService } from "@/lib/services/category.service";
import { AdminCategoriesManager } from "@/components/admin/categories/admin-categories-manager";

export default async function AdminCategoriesPage() {
  const categories = await CategoryService.list();
  return <AdminCategoriesManager initialCategories={categories} />;
}
