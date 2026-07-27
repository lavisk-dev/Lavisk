import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { mockCollections } from "@/lib/data/mock-data";
import type { Collection } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { EventBus, EventTypes } from "@/lib/services/automation";

const logger = {
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(`[CollectionService] ${message}`, meta ?? "");
  },
};

export const CollectionService = {
  async list(): Promise<Collection[]> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase.from("collections").select("*").order("sort_order");
        if (error) {
          logger.error("list failed", { message: error.message, code: error.code, details: error.details, hint: error.hint });
        } else if (data) {
          return data as unknown as Collection[];
        }
      }
    }
    return [...mockCollections].sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getBySlug(slug: string): Promise<Collection | null> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("collections")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        if (error) {
          logger.error("getBySlug failed", { slug, message: error.message, code: error.code, details: error.details, hint: error.hint });
        } else if (data) {
          return data as unknown as Collection;
        }
      }
    }
    return mockCollections.find((c) => c.slug === slug) ?? null;
  },

  async getById(id: string): Promise<Collection | null> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("collections")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (error) {
          logger.error("getById failed", { id, message: error.message, code: error.code, details: error.details, hint: error.hint });
        } else if (data) {
          return data as unknown as Collection;
        }
      }
    }
    return mockCollections.find((c) => c.id === id) ?? null;
  },

  async create(input: Partial<Collection>): Promise<Collection> {
    const admin = createAdminClient();
    const payload = { ...input, slug: input.slug ?? slugify(input.name ?? "") };
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin.from("collections").insert(payload).select().single();
      if (error) {
        logger.error("create failed", { message: error.message, code: error.code, details: error.details, hint: error.hint });
        throw new Error(error.message);
      }
      return data as unknown as Collection;
    }
    const collection: Collection = {
      id: `col_${Date.now()}`,
      name: input.name ?? "Untitled",
      slug: payload.slug as string,
      description: input.description ?? "",
      bannerImage: input.bannerImage ?? null,
      thumbnailImage: input.thumbnailImage ?? null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockCollections.push(collection);
    EventBus.publish(EventTypes.COLLECTION_CREATED, {
      entityType: "collection",
      entityId: collection.id,
      collectionSlug: collection.slug,
    });
    return collection;
  },

  async update(id: string, input: Partial<Collection>): Promise<Collection> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin
        .from("collections")
        .update({ ...input, updatedAt: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) {
        logger.error("update failed", { id, message: error.message, code: error.code, details: error.details, hint: error.hint });
        throw new Error(error.message);
      }
      return data as unknown as Collection;
    }
    const collection = mockCollections.find((c) => c.id === id);
    if (!collection) throw new Error("Collection not found");
    Object.assign(collection, input, { updatedAt: new Date().toISOString() });
    EventBus.publish(EventTypes.COLLECTION_UPDATED, {
      entityType: "collection",
      entityId: id,
      collectionSlug: collection.slug,
    });
    return collection;
  },

  async remove(id: string): Promise<void> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { error } = await admin.from("collections").delete().eq("id", id);
      if (error) {
        logger.error("remove failed", { id, message: error.message, code: error.code, details: error.details, hint: error.hint });
        throw new Error(error.message);
      }
      return;
    }
    const idx = mockCollections.findIndex((c) => c.id === id);
    if (idx >= 0) {
      mockCollections.splice(idx, 1);
      EventBus.publish(EventTypes.COLLECTION_DELETED, {
        entityType: "collection",
        entityId: id,
      });
    }
  },
};