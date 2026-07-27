import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { mockReviews } from "@/lib/data/mock-data";
import type { Review } from "@/lib/types";
import { EventBus, EventTypes } from "@/lib/services/automation";

export const ReviewService = {
  async listByProduct(productId: string): Promise<Review[]> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", productId)
          .eq("is_approved", true)
          .order("created_at", { ascending: false });
        if (data) return data as unknown as Review[];
      }
    }
    return mockReviews.filter((r) => r.productId === productId && r.isApproved);
  },

  async listAll(): Promise<Review[]> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
        if (data) return data as unknown as Review[];
      }
    }
    return mockReviews;
  },

  async create(input: Omit<Review, "id" | "createdAt" | "isApproved">): Promise<Review> {
    const review: Review = {
      ...input,
      id: `rev_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isApproved: false,
    };
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin.from("reviews").insert(review).select().single();
      if (!error && data) return data as unknown as Review;
    }
    mockReviews.push(review);
    EventBus.publish(EventTypes.REVIEW_CREATED, {
      entityType: "review",
      entityId: review.id,
      productId: review.productId,
      rating: review.rating,
      isApproved: false,
    });
    return review;
  },

  async setApproval(id: string, isApproved: boolean): Promise<void> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      await admin.from("reviews").update({ is_approved: isApproved }).eq("id", id);
      return;
    }
    const review = mockReviews.find((r) => r.id === id);
    if (review) {
      review.isApproved = isApproved;
      EventBus.publish(
        isApproved ? EventTypes.REVIEW_APPROVED : EventTypes.REVIEW_REJECTED,
        {
          entityType: "review",
          entityId: id,
          productId: review.productId,
          rating: review.rating,
          isApproved,
        }
      );
    }
  },
};
