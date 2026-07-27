import "server-only";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { TrackingEvent } from "@/lib/types";
import { logger } from "@/lib/core/logging";

const mockTrackingEvents: TrackingEvent[] = [];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapRow(row: Record<string, unknown>): TrackingEvent {
  return {
    id: String(row.id ?? ""),
    shipmentId: String(row.shipment_id ?? ""),
    status: String(row.status ?? ""),
    location: row.location ? String(row.location) : null,
    description: row.description ? String(row.description) : null,
    courierUpdate: row.courier_update ? String(row.courier_update) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function toRow(event: TrackingEvent): Record<string, unknown> {
  return {
    id: event.id,
    shipment_id: event.shipmentId,
    status: event.status,
    location: event.location,
    description: event.description,
    courier_update: event.courierUpdate,
    created_at: event.createdAt,
  };
}

export const TrackingService = {
  async addEvent(data: {
    shipmentId: string;
    status: string;
    location?: string;
    description?: string;
    courierUpdate?: string;
  }): Promise<TrackingEvent> {
    const event: TrackingEvent = {
      id: generateId("trk"),
      shipmentId: data.shipmentId,
      status: data.status,
      location: data.location ?? null,
      description: data.description ?? null,
      courierUpdate: data.courierUpdate ?? null,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        const { error } = await supabase.from("tracking_events").insert(toRow(event));
        if (error) {
          logger.error("Failed to insert tracking event", { error: error.message, metadata: { shipmentId: data.shipmentId } });
        }
      }
    }
    mockTrackingEvents.push(event);
    return event;
  },

  async getByShipmentId(shipmentId: string): Promise<TrackingEvent[]> {
    if (isSupabaseAdminConfigured) {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("tracking_events")
          .select("*")
          .eq("shipment_id", shipmentId)
          .order("created_at", { ascending: true });
        if (error) {
          logger.error("Failed to fetch tracking events", { error: error.message, metadata: { shipmentId } });
        }
        if (data) return data.map(mapRow);
      }
    }
    return mockTrackingEvents.filter((e) => e.shipmentId === shipmentId);
  },

  async getLatestStatus(shipmentId: string): Promise<string | null> {
    const events = await TrackingService.getByShipmentId(shipmentId);
    if (events.length === 0) return null;
    return events[events.length - 1].status;
  },
};