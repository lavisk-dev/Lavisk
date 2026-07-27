import "server-only";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { PickupRequest } from "@/lib/types";
import { logger } from "@/lib/core/logging";
import { NotFoundError } from "@/lib/core/errors";

const mockPickups: PickupRequest[] = [];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapRow(row: Record<string, unknown>): PickupRequest {
  return {
    id: String(row.id ?? ""),
    shipmentId: String(row.shipment_id ?? ""),
    status: String(row.status ?? "pending"),
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null,
    pickupAddress: row.pickup_address ? String(row.pickup_address) : null,
    pickupTime: row.pickup_time ? String(row.pickup_time) : null,
    cancelledAt: row.cancelled_at ? String(row.cancelled_at) : null,
    retryCount: Number(row.retry_count ?? 0),
    notes: row.notes ? String(row.notes) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function toRow(pickup: PickupRequest): Record<string, unknown> {
  return {
    id: pickup.id,
    shipment_id: pickup.shipmentId,
    status: pickup.status,
    scheduled_at: pickup.scheduledAt,
    pickup_address: pickup.pickupAddress,
    pickup_time: pickup.pickupTime,
    cancelled_at: pickup.cancelledAt,
    retry_count: pickup.retryCount,
    notes: pickup.notes,
    created_at: pickup.createdAt,
    updated_at: pickup.updatedAt,
  };
}

export const PickupService = {
  async create(data: {
    shipmentId: string;
    scheduledAt: string;
    pickupAddress: string;
    pickupTime?: string;
  }): Promise<PickupRequest> {
    const now = new Date().toISOString();
    const pickup: PickupRequest = {
      id: generateId("pck"),
      shipmentId: data.shipmentId,
      status: "scheduled",
      scheduledAt: data.scheduledAt,
      pickupAddress: data.pickupAddress,
      pickupTime: data.pickupTime ?? null,
      cancelledAt: null,
      retryCount: 0,
      notes: null,
      createdAt: now,
      updatedAt: now,
    };

    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        const { error } = await supabase.from("pickup_requests").insert(toRow(pickup));
        if (error) {
          logger.error("Failed to insert pickup request", { error: error.message, metadata: { shipmentId: data.shipmentId } });
        }
      }
    }
    mockPickups.push(pickup);
    return pickup;
  },

  async getByShipmentId(shipmentId: string): Promise<PickupRequest | null> {
    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("pickup_requests")
          .select("*")
          .eq("shipment_id", shipmentId)
          .single();
        if (error && error.code !== "PGRST116") {
          logger.error("Failed to fetch pickup", { error: error.message, metadata: { shipmentId } });
        }
        if (data) return mapRow(data);
      }
    }
    return mockPickups.find((p) => p.shipmentId === shipmentId) ?? null;
  },

  async update(id: string, updates: Partial<PickupRequest>): Promise<PickupRequest> {
    const existing = mockPickups.find((p) => p.id === id);
    if (!existing) throw new NotFoundError(`Pickup ${id} not found`);

    const updated: PickupRequest = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };

    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        await supabase.from("pickup_requests").update(toRow(updated)).eq("id", id);
      }
    }

    const idx = mockPickups.findIndex((p) => p.id === id);
    if (idx >= 0) mockPickups[idx] = updated;
    return updated;
  },

  async list(params?: { pageSize?: number; page?: number; status?: string }): Promise<{ pickups: PickupRequest[]; total: number }> {
    const pageSize = params?.pageSize ?? 50;
    const page = params?.page ?? 1;

    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        let query = supabase.from("pickup_requests").select("*", { count: "exact" });
        if (params?.status) query = query.eq("status", params.status);
        query = query.order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
        const { data, error, count } = await query;
        if (error) {
          logger.error("Failed to list pickups", { error: error.message });
        }
        if (data) return { pickups: data.map(mapRow), total: count ?? data.length };
      }
    }

    let filtered = [...mockPickups];
    if (params?.status) filtered = filtered.filter((p) => p.status === params.status);
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const total = filtered.length;
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
    return { pickups: paged, total };
  },
};