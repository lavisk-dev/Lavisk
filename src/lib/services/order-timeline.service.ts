import "server-only";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { OrderTimelineEntry } from "@/lib/types";

const mockTimeline: OrderTimelineEntry[] = [];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapRowToTimeline(row: Record<string, unknown>): OrderTimelineEntry {
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    status: row.status as string,
    previousStatus: row.previous_status as string,
    note: (row.note as string) ?? null,
    performedBy: row.performed_by as string,
    createdAt: row.created_at as string,
  };
}

export const OrderTimelineService = {
  async addEntry(
    orderId: string,
    status: string,
    previousStatus: string,
    performedBy: string,
    note?: string | null
  ): Promise<OrderTimelineEntry> {
    const entry: OrderTimelineEntry = {
      id: generateId("ot"),
      orderId,
      status,
      previousStatus,
      note: note ?? null,
      performedBy,
      createdAt: new Date().toISOString(),
    };

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { error } = await admin.from("order_timeline").insert({
        id: entry.id,
        order_id: entry.orderId,
        status: entry.status,
        previous_status: entry.previousStatus,
        note: entry.note,
        performed_by: entry.performedBy,
        created_at: entry.createdAt,
      });
      if (error) throw new Error(`Failed to insert timeline: ${error.message}`);
    } else {
      mockTimeline.unshift(entry);
    }

    return entry;
  },

  async getByOrderId(orderId: string): Promise<OrderTimelineEntry[]> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data } = await admin
        .from("order_timeline")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      if (data) return data.map(mapRowToTimeline);
    }
    return mockTimeline.filter((e) => e.orderId === orderId);
  },
};