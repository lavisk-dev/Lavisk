import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { mockCoupons } from "@/lib/data/mock-data";
import type { Coupon } from "@/lib/types";
import { EventBus, EventTypes } from "@/lib/services/automation";

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  discount: number;
  coupon?: Coupon;
}

export const CouponService = {
  async list(): Promise<Coupon[]> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase.from("coupons").select("*");
        if (data) return data as unknown as Coupon[];
      }
    }
    return mockCoupons;
  },

  async validate(code: string, subtotal: number): Promise<CouponValidationResult> {
    const coupons = await this.list();
    const coupon = coupons.find(
      (c) => c.code.toLowerCase() === code.trim().toLowerCase() && c.isActive
    );

    if (!coupon) return { valid: false, reason: "This code doesn't exist or has expired.", discount: 0 };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, reason: "This code has expired.", discount: 0 };
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, reason: "This code has reached its usage limit.", discount: 0 };
    }
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      return {
        valid: false,
        reason: `Add ${coupon.minOrderValue - subtotal} more to use this code.`,
        discount: 0,
      };
    }

    let discount =
      coupon.type === "percentage" ? (subtotal * coupon.value) / 100 : coupon.value;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.min(discount, subtotal);

    return { valid: true, discount: Math.round(discount * 100) / 100, coupon };
  },

  async create(input: Partial<Coupon>): Promise<Coupon> {
    const admin = createAdminClient();
    const payload = { usedCount: 0, ...input };
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin.from("coupons").insert(payload).select().single();
      if (error) throw new Error(error.message);
      return data as unknown as Coupon;
    }
    const coupon: Coupon = {
      id: `c_${Date.now()}`,
      code: input.code ?? "",
      type: input.type ?? "percentage",
      value: input.value ?? 0,
      minOrderValue: input.minOrderValue,
      maxDiscount: input.maxDiscount,
      expiresAt: input.expiresAt ?? null,
      isActive: input.isActive ?? true,
      usageLimit: input.usageLimit,
      usedCount: 0,
    };
    mockCoupons.push(coupon);
    EventBus.publish(EventTypes.COUPON_CREATED, {
      entityType: "coupon",
      entityId: coupon.id,
      code: coupon.code,
    });
    return coupon;
  },

  async update(id: string, input: Partial<Coupon>): Promise<Coupon> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin.from("coupons").update(input).eq("id", id).select().single();
      if (error) throw new Error(error.message);
      return data as unknown as Coupon;
    }
    const coupon = mockCoupons.find((c) => c.id === id);
    if (!coupon) throw new Error("Coupon not found");
    Object.assign(coupon, input);
    return coupon;
  },

  async incrementUsage(id: string): Promise<void> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data } = await admin.from("coupons").select("used_count").eq("id", id).single();
      if (data) {
        await admin
          .from("coupons")
          .update({ used_count: (data.used_count as number) + 1 })
          .eq("id", id);
      }
      return;
    }
    const coupon = mockCoupons.find((c) => c.id === id);
    if (coupon) {
      coupon.usedCount += 1;
      EventBus.publish(EventTypes.COUPON_USAGE_INCREMENTED, {
        entityType: "coupon",
        entityId: id,
        code: coupon.code,
      });
    }
  },

  async remove(id: string): Promise<void> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { error } = await admin.from("coupons").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
    const idx = mockCoupons.findIndex((c) => c.id === id);
    if (idx >= 0) mockCoupons.splice(idx, 1);
  },
};
