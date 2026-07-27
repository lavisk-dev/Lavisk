import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { mockCategories } from "@/lib/data/mock-data";
import type { Category } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { EventBus, EventTypes } from "@/lib/services/automation";

export const CategoryService = {
  async list(): Promise<Category[]> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase.from("categories").select("*").order("name");
        if (data) return data as unknown as Category[];
      }
    }
    return mockCategories;
  },

  async getBySlug(slug: string): Promise<Category | null> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase
          .from("categories")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        if (data) return data as unknown as Category;
      }
    }
    return mockCategories.find((c) => c.slug === slug) ?? null;
  },

  // NOTE: writes fall back to mutating the in-memory mock array when
  // Supabase isn't configured, so the admin panel is fully demoable
  // out of the box. This resets on server restart — connect Supabase
  // for real persistence.
  async create(input: Partial<Category>): Promise<Category> {
    const admin = createAdminClient();
    const payload = { ...input, slug: input.slug ?? slugify(input.name ?? "") };
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin.from("categories").insert(payload).select().single();
      if (error) throw new Error(error.message);
      return data as unknown as Category;
    }
    const category: Category = {
      id: `cat_${Date.now()}`,
      name: input.name ?? "Untitled",
      slug: payload.slug as string,
      count: input.count ?? 0,
      gradientFrom: input.gradientFrom ?? "#FFE9EF",
      gradientTo: input.gradientTo ?? "#FFDCE6",
      blobColor: input.blobColor ?? "#FFB6C9",
      imageUrl: input.imageUrl ?? null,
      imagePublicId: input.imagePublicId ?? null,
    };
    mockCategories.push(category);
    EventBus.publish(EventTypes.CATEGORY_CREATED, {
      entityType: "category",
      entityId: category.id,
      categorySlug: category.slug,
    });
    return category;
  },

  async update(id: string, input: Partial<Category>): Promise<Category> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin
        .from("categories")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as unknown as Category;
    }
    const category = mockCategories.find((c) => c.id === id);
    if (!category) throw new Error("Category not found");
    Object.assign(category, input);
    EventBus.publish(EventTypes.CATEGORY_UPDATED, {
      entityType: "category",
      entityId: id,
      categorySlug: category.slug,
    });
    return category;
  },

  async remove(id: string): Promise<void> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { error } = await admin.from("categories").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
    const idx = mockCategories.findIndex((c) => c.id === id);
    if (idx >= 0) {
      mockCategories.splice(idx, 1);
      EventBus.publish(EventTypes.CATEGORY_DELETED, {
        entityType: "category",
        entityId: id,
      });
    }
  },
};
