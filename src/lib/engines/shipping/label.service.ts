import "server-only";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { ShippingLabel } from "@/lib/types";
import { logger } from "@/lib/core/logging";

const mockLabels: ShippingLabel[] = [];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapRow(row: Record<string, unknown>): ShippingLabel {
  return {
    id: String(row.id ?? ""),
    shipmentId: String(row.shipment_id ?? ""),
    format: String(row.format ?? "pdf"),
    url: row.url ? String(row.url) : null,
    size: row.size ? String(row.size) : "a4",
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function toRow(label: ShippingLabel): Record<string, unknown> {
  return {
    id: label.id,
    shipment_id: label.shipmentId,
    format: label.format,
    url: label.url,
    size: label.size,
    created_at: label.createdAt,
  };
}

export const LabelService = {
  async save(data: {
    shipmentId: string;
    format?: string;
    url?: string;
    size?: string;
  }): Promise<ShippingLabel> {
    const label: ShippingLabel = {
      id: generateId("lbl"),
      shipmentId: data.shipmentId,
      format: data.format ?? "pdf",
      url: data.url ?? null,
      size: data.size ?? "a4",
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        const { error } = await supabase.from("shipping_labels").insert(toRow(label));
        if (error) {
          logger.error("Failed to save label", { error: error.message, metadata: { shipmentId: data.shipmentId } });
        }
      }
    }
    mockLabels.push(label);
    return label;
  },

  async getByShipmentId(shipmentId: string): Promise<ShippingLabel[]> {
    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("shipping_labels")
          .select("*")
          .eq("shipment_id", shipmentId)
          .order("created_at", { ascending: false });
        if (error) {
          logger.error("Failed to fetch labels", { error: error.message, metadata: { shipmentId } });
        }
        if (data) return data.map(mapRow);
      }
    }
    return mockLabels.filter((l) => l.shipmentId === shipmentId);
  },
};