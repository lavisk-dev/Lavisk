import "server-only";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { Shipment, ShipmentStatus } from "@/lib/types";
import { logger } from "@/lib/core/logging";
import { NotFoundError } from "@/lib/core/errors";

const mockShipments: Shipment[] = [];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapRow(row: Record<string, unknown>): Shipment {
  return {
    id: String(row.id ?? ""),
    orderId: String(row.order_id ?? ""),
    trackingNumber: row.tracking_number ? String(row.tracking_number) : null,
    courier: String(row.courier ?? ""),
    provider: String(row.provider ?? ""),
    weight: row.weight ? Number(row.weight) : null,
    length: row.length ? Number(row.length) : null,
    width: row.width ? Number(row.width) : null,
    height: row.height ? Number(row.height) : null,
    dimensionUnit: row.dimension_unit ? String(row.dimension_unit) : "cm",
    status: String(row.status ?? "pending") as ShipmentStatus,
    pickupStatus: String(row.pickup_status ?? "pending"),
    pickupScheduledAt: row.pickup_scheduled_at ? String(row.pickup_scheduled_at) : null,
    pickedUpAt: row.picked_up_at ? String(row.picked_up_at) : null,
    deliveredAt: row.delivered_at ? String(row.delivered_at) : null,
    estimatedDelivery: row.estimated_delivery ? String(row.estimated_delivery) : null,
    labelUrl: row.label_url ? String(row.label_url) : null,
    labelFormat: row.label_format ? String(row.label_format) : null,
    packingSlipUrl: row.packing_slip_url ? String(row.packing_slip_url) : null,
    invoiceUrl: row.invoice_url ? String(row.invoice_url) : null,
    qrCode: row.qr_code ? String(row.qr_code) : null,
    barcode: row.barcode ? String(row.barcode) : null,
    shippingCost: row.shipping_cost ? Number(row.shipping_cost) : null,
    isReturn: Boolean(row.is_return),
    returnReason: row.return_reason ? String(row.return_reason) : null,
    notes: row.notes ? String(row.notes) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function toRow(shipment: Shipment): Record<string, unknown> {
  return {
    id: shipment.id,
    order_id: shipment.orderId,
    tracking_number: shipment.trackingNumber,
    courier: shipment.courier,
    provider: shipment.provider,
    weight: shipment.weight,
    length: shipment.length,
    width: shipment.width,
    height: shipment.height,
    dimension_unit: shipment.dimensionUnit,
    status: shipment.status,
    pickup_status: shipment.pickupStatus,
    pickup_scheduled_at: shipment.pickupScheduledAt,
    picked_up_at: shipment.pickedUpAt,
    delivered_at: shipment.deliveredAt,
    estimated_delivery: shipment.estimatedDelivery,
    label_url: shipment.labelUrl,
    label_format: shipment.labelFormat,
    packing_slip_url: shipment.packingSlipUrl,
    invoice_url: shipment.invoiceUrl,
    qr_code: shipment.qrCode,
    barcode: shipment.barcode,
    shipping_cost: shipment.shippingCost,
    is_return: shipment.isReturn,
    return_reason: shipment.returnReason,
    notes: shipment.notes,
    created_at: shipment.createdAt,
    updated_at: shipment.updatedAt,
  };
}

export const ShipmentService = {
  async create(data: {
    orderId: string;
    courier: string;
    provider: string;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: string;
    isReturn?: boolean;
    returnReason?: string;
    notes?: string;
  }): Promise<Shipment> {
    const now = new Date().toISOString();
    const shipment: Shipment = {
      id: generateId("shp"),
      orderId: data.orderId,
      trackingNumber: null,
      courier: data.courier,
      provider: data.provider,
      weight: data.weight ?? null,
      length: data.length ?? null,
      width: data.width ?? null,
      height: data.height ?? null,
      dimensionUnit: data.dimensionUnit ?? "cm",
      status: "pending",
      pickupStatus: "pending",
      pickupScheduledAt: null,
      pickedUpAt: null,
      deliveredAt: null,
      estimatedDelivery: null,
      labelUrl: null,
      labelFormat: null,
      packingSlipUrl: null,
      invoiceUrl: null,
      qrCode: null,
      barcode: null,
      shippingCost: null,
      isReturn: data.isReturn ?? false,
      returnReason: data.returnReason ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };

    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        const { error } = await supabase.from("shipments").insert(toRow(shipment));
        if (error) {
          logger.error("Failed to insert shipment", { entityId: data.orderId, error: error.message, metadata: { error } });
        }
      }
    }
    mockShipments.push(shipment);
    logger.info("Shipment created", { entity: "shipment", entityId: shipment.id });
    return shipment;
  },

  async getById(id: string): Promise<Shipment | null> {
    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase.from("shipments").select("*").eq("id", id).single();
        if (error && error.code !== "PGRST116") {
          logger.error("Failed to fetch shipment", { entityId: id, error: error.message });
        }
        if (data) return mapRow(data);
      }
    }
    return mockShipments.find((s) => s.id === id) ?? null;
  },

  async getByOrderId(orderId: string): Promise<Shipment[]> {
    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase.from("shipments").select("*").eq("order_id", orderId);
        if (error) {
          logger.error("Failed to fetch shipments by order", { entityId: orderId, error: error.message });
        }
        if (data) return data.map(mapRow);
      }
    }
    return mockShipments.filter((s) => s.orderId === orderId);
  },

  async list(params?: {
    pageSize?: number;
    page?: number;
    status?: string;
    courier?: string;
  }): Promise<{ shipments: Shipment[]; total: number }> {
    const pageSize = params?.pageSize ?? 50;
    const page = params?.page ?? 1;

    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        let query = supabase.from("shipments").select("*", { count: "exact" });
        if (params?.status) query = query.eq("status", params.status);
        if (params?.courier) query = query.eq("courier", params.courier);
        query = query.order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
        const { data, error, count } = await query;
        if (error) {
          logger.error("Failed to list shipments", { error: error.message });
        }
        if (data) return { shipments: data.map(mapRow), total: count ?? data.length };
      }
    }

    let filtered = [...mockShipments];
    if (params?.status) filtered = filtered.filter((s) => s.status === params.status);
    if (params?.courier) filtered = filtered.filter((s) => s.courier === params.courier);
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const total = filtered.length;
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
    return { shipments: paged, total };
  },

  async update(id: string, updates: Partial<Shipment>): Promise<Shipment> {
    const existing = await ShipmentService.getById(id);
    if (!existing) throw new NotFoundError(`Shipment ${id} not found`);

    const updated: Shipment = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };

    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        const { error } = await supabase.from("shipments").update(toRow(updated)).eq("id", id);
        if (error) {
          logger.error("Failed to update shipment", { entityId: id, error: error.message });
        }
      }
    }

    const idx = mockShipments.findIndex((s) => s.id === id);
    if (idx >= 0) mockShipments[idx] = updated;
    return updated;
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        await supabase.from("shipments").delete().eq("id", id);
      }
    }
    const idx = mockShipments.findIndex((s) => s.id === id);
    if (idx >= 0) mockShipments.splice(idx, 1);
  },

  async getStats(): Promise<{
    total: number;
    pending: number;
    inTransit: number;
    delivered: number;
    failed: number;
    returned: number;
  }> {
    const { shipments } = await ShipmentService.list({ pageSize: 10000 });
    return {
      total: shipments.length,
      pending: shipments.filter((s) => s.status === "pending" || s.status === "label_generated" || s.status === "pickup_scheduled").length,
      inTransit: shipments.filter((s) => s.status === "in_transit" || s.status === "out_for_delivery").length,
      delivered: shipments.filter((s) => s.status === "delivered").length,
      failed: shipments.filter((s) => s.status === "delivery_failed").length,
      returned: shipments.filter((s) => s.status === "returned" || s.status === "lost" || s.status === "damaged").length,
    };
  },

  async getDashboard(): Promise<{
    stats: {
      total: number;
      pending: number;
      inTransit: number;
      delivered: number;
      failed: number;
      returned: number;
    };
    recentShipments: Shipment[];
  }> {
    const stats = await ShipmentService.getStats();
    const { shipments } = await ShipmentService.list({ pageSize: 10 });
    return { stats, recentShipments: shipments };
  },
};