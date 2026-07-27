import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { mockProducts } from "@/lib/data/mock-data";
import type { Product } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { EventBus, EventTypes } from "@/lib/services/automation";

export interface ProductFilters {
  category?: string;
  collection?: string;
  collections?: string[];
  search?: string;
  featured?: boolean;
  trending?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "rating";
  page?: number;
  pageSize?: number;
}

export interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

function filterMock(filters: ProductFilters): ProductListResult {
  let items = mockProducts.filter((p) => p.isActive);

  if (filters.category) {
    items = items.filter((p) => p.categorySlug === filters.category);
  }
  if (filters.collection) {
    items = items.filter((p) => p.collectionSlug === filters.collection);
  }
  if (filters.collections) {
    items = items.filter((p) => p.collectionSlugs?.some((s) => filters.collections?.includes(s)));
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }
  if (filters.featured) items = items.filter((p) => p.isFeatured);
  if (filters.trending) items = items.filter((p) => p.isTrending);
  if (typeof filters.minPrice === "number") {
    items = items.filter((p) => p.price >= (filters.minPrice as number));
  }
  if (typeof filters.maxPrice === "number") {
    items = items.filter((p) => p.price <= (filters.maxPrice as number));
  }

  switch (filters.sort) {
    case "price-asc":
      items = [...items].sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      items = [...items].sort((a, b) => b.price - a.price);
      break;
    case "rating":
      items = [...items].sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
    default:
      items = [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 24;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return { products: paged, total: items.length, page, pageSize };
}

export const ProductService = {
  async list(filters: ProductFilters = {}): Promise<ProductListResult> {
    if (!isSupabaseConfigured) return filterMock(filters);

    const supabase = await createClient();
    if (!supabase) return filterMock(filters);

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 24;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .range(from, to);

    if (filters.category) query = query.eq("category_slug", filters.category);
    if (filters.collection) query = query.eq("collection_slug", filters.collection);
    if (filters.collections) {
      query = query.overlaps("collection_slug", filters.collections);
    }
    if (filters.search) query = query.ilike("name", `%${filters.search}%`);
    if (filters.featured) query = query.eq("is_featured", true);
    if (filters.trending) query = query.eq("is_trending", true);
    if (typeof filters.minPrice === "number") query = query.gte("price", filters.minPrice);
    if (typeof filters.maxPrice === "number") query = query.lte("price", filters.maxPrice);

    const sortMap: Record<string, { column: string; ascending: boolean }> = {
      "price-asc": { column: "price", ascending: true },
      "price-desc": { column: "price", ascending: false },
      rating: { column: "rating", ascending: false },
      newest: { column: "created_at", ascending: false },
    };
    const sort = sortMap[filters.sort ?? "newest"];
    query = query.order(sort.column, { ascending: sort.ascending });

    const { data, error, count } = await query;
    if (error || !data) return filterMock(filters);

    return {
      products: data as unknown as Product[],
      total: count ?? data.length,
      page,
      pageSize,
    };
  },

  async getBySlug(slug: string): Promise<Product | null> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        if (data) return data as unknown as Product;
      }
    }
    return mockProducts.find((p) => p.slug === slug) ?? null;
  },

  async getById(id: string): Promise<Product | null> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (data) return data as unknown as Product;
      }
    }
    return mockProducts.find((p) => p.id === id) ?? null;
  },

  async getRelated(product: Product, limit = 4): Promise<Product[]> {
    const { products } = await this.list({ category: product.categorySlug, pageSize: limit + 1 });
    return products.filter((p) => p.id !== product.id).slice(0, limit);
  },

  async create(input: Partial<Product>): Promise<Product> {
    const admin = createAdminClient();
    const payload = {
      ...input,
      slug: input.slug ?? slugify(input.name ?? ""),
    };
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin.from("products").insert(payload).select().single();
      if (error) throw new Error(error.message);
      return data as unknown as Product;
    }
    const product: Product = {
      id: `p_${Date.now()}`,
      slug: payload.slug as string,
      name: input.name ?? "Untitled product",
      description: input.description ?? "",
      story: input.story ?? "",
      price: input.price ?? 0,
      compareAtPrice: input.compareAtPrice ?? null,
      tag: input.tag ?? null,
      categorySlug: input.categorySlug ?? "just-because",
      collectionSlug: input.collectionSlug ?? null,
      collectionSlugs: input.collectionSlugs ?? (input.collectionSlug ? [input.collectionSlug] : []),
      gradientFrom: input.gradientFrom ?? "#FFB6C9",
      gradientTo: input.gradientTo ?? "#FF8FA3",
      images: input.images ?? [],
      rating: input.rating ?? 5,
      reviewCount: input.reviewCount ?? 0,
      stock: input.stock ?? 0,
      isActive: input.isActive ?? true,
      isFeatured: input.isFeatured ?? false,
      isTrending: input.isTrending ?? false,
      createdAt: new Date().toISOString(),
    };
    mockProducts.push(product);
    EventBus.publish(EventTypes.PRODUCT_CREATED, {
      entityType: "product",
      entityId: product.id,
      productSlug: product.slug,
      productName: product.name,
      categorySlug: product.categorySlug,
    });
    return product;
  },

  async update(id: string, input: Partial<Product>): Promise<Product> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin
        .from("products")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as unknown as Product;
    }
    const product = mockProducts.find((p) => p.id === id);
    if (!product) throw new Error("Product not found");
    Object.assign(product, input);
        if (input.collectionSlug && !product.collectionSlugs?.includes(input.collectionSlug)) {
      product.collectionSlugs = [...(product.collectionSlugs ?? []), input.collectionSlug];
    }
    EventBus.publish(EventTypes.PRODUCT_UPDATED, {
      entityType: "product",
      entityId: product.id,
      productSlug: product.slug,
      productName: product.name,
      categorySlug: product.categorySlug,
    });
    return product;
  },

  async decrementStock(productId: string, quantity: number): Promise<void> {
    const admin = createAdminClient();
    let previousStock = 0;
    if (isSupabaseAdminConfigured && admin) {
      const { data } = await admin
        .from("products")
        .select("stock")
        .eq("id", productId)
        .single();
      if (data) {
        previousStock = data.stock as number;
        const newStock = Math.max(0, previousStock - quantity);
        await admin.from("products").update({ stock: newStock }).eq("id", productId);
        if (newStock <= 5 && newStock > 0) {
          EventBus.publish(EventTypes.INVENTORY_LOW_STOCK, {
            entityType: "product",
            entityId: productId,
            previousStock,
            newStock,
            quantity,
          });
        }
        EventBus.publish(EventTypes.INVENTORY_DECREMENTED, {
          entityType: "product",
          entityId: productId,
          previousStock,
          newStock,
          quantity,
        });
      }
      return;
    }
    const product = mockProducts.find((p) => p.id === productId);
    if (product) {
      previousStock = product.stock;
      product.stock = Math.max(0, product.stock - quantity);
      if (product.stock <= 5 && product.stock > 0) {
        EventBus.publish(EventTypes.INVENTORY_LOW_STOCK, {
          entityType: "product",
          entityId: productId,
          previousStock,
          newStock: product.stock,
          quantity,
        });
      }
      EventBus.publish(EventTypes.INVENTORY_DECREMENTED, {
        entityType: "product",
        entityId: productId,
        previousStock,
        newStock: product.stock,
        quantity,
      });
    }
  },

  async remove(id: string): Promise<void> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { error } = await admin.from("products").delete().eq("id", id);
      if (error) throw new Error(error.message);
      EventBus.publish(EventTypes.PRODUCT_DELETED, {
        entityType: "product",
        entityId: id,
      });
      return;
    }
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx >= 0) {
      const product = mockProducts[idx];
      mockProducts.splice(idx, 1);
      EventBus.publish(EventTypes.PRODUCT_DELETED, {
        entityType: "product",
        entityId: id,
        productSlug: product.slug,
        categorySlug: product.categorySlug,
      });
    }
  },
};