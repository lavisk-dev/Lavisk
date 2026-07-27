import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { mockBanners } from "@/lib/data/mock-data";
import type { Banner } from "@/lib/types";

export const BannerService = {
  async listActive(): Promise<Banner[]> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase
          .from("banners")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");
        if (data) return data as unknown as Banner[];
      }
    }
    return mockBanners.filter((b) => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async listAll(): Promise<Banner[]> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase.from("banners").select("*").order("sort_order");
        if (data) return data as unknown as Banner[];
      }
    }
    return [...mockBanners].sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async create(input: Partial<Banner>): Promise<Banner> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin.from("banners").insert(input).select().single();
      if (error) throw new Error(error.message);
      return data as unknown as Banner;
    }
    const banner: Banner = {
      id: `b_${Date.now()}`,
      title: input.title ?? "Untitled",
      subtitle: input.subtitle,
      imageUrl: input.imageUrl ?? null,
      imagePublicId: input.imagePublicId ?? null,
      ctaLabel: input.ctaLabel,
      ctaHref: input.ctaHref,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? mockBanners.length,
    };
    mockBanners.push(banner);
    return banner;
  },

  async update(id: string, input: Partial<Banner>): Promise<Banner> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin.from("banners").update(input).eq("id", id).select().single();
      if (error) throw new Error(error.message);
      return data as unknown as Banner;
    }
    const banner = mockBanners.find((b) => b.id === id);
    if (!banner) throw new Error("Banner not found");
    Object.assign(banner, input);
    return banner;
  },

  async remove(id: string): Promise<void> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { error } = await admin.from("banners").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
    const idx = mockBanners.findIndex((b) => b.id === id);
    if (idx >= 0) mockBanners.splice(idx, 1);
  },
};
