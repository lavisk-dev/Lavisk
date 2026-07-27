import type {
  ShippingProvider,
  CreateShipmentInput,
  CreateShipmentResult,
  GenerateLabelInput,
  GenerateLabelResult,
  SchedulePickupInput,
  SchedulePickupResult,
  CancelPickupInput,
  CancelPickupResult,
  TrackShipmentResult,
  CancelShipmentResult,
  ShippingRateInput,
  ShippingRateResult,
} from "../types";
import { config } from "@/lib/core/config";

const apiKey = config.get("SHIPROCKET_API_KEY");
const apiSecret = config.get("SHIPROCKET_API_SECRET");
const apiUrl = config.get("SHIPROCKET_API_URL") ?? "https://apiv2.shiprocket.in/v1/external";

let authToken: string | null = null;

async function authenticate(): Promise<void> {
  if (!apiKey || !apiSecret) throw new Error("Shiprocket not configured");
  const res = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: apiKey, password: apiSecret }),
  });
  const data = await res.json();
  authToken = data.token;
}

async function request(method: string, path: string, body?: unknown) {
  if (!authToken) await authenticate();
  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    authToken = null;
    await authenticate();
    return request(method, path, body);
  }
  return res.json();
}

export const ShiprocketProvider: ShippingProvider = {
  name: "shiprocket",

  isConfigured(): boolean {
    return Boolean(apiKey && apiSecret);
  },

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    try {
      const data = await request("POST", "/shipments/create/forward", {
        order_id: input.orderId,
        order_date: new Date().toISOString(),
        pickup_customer_name: "Lavisk Warehouse",
        pickup_address: "123 Warehouse Lane",
        pickup_city: "Mumbai",
        pickup_state: "Maharashtra",
        pickup_country: "India",
        pickup_pincode: "400001",
        delivery_customer_name: input.customerName,
        delivery_address: input.shippingAddress.line1,
        delivery_address_2: input.shippingAddress.line2 ?? "",
        delivery_city: input.shippingAddress.city,
        delivery_state: input.shippingAddress.state,
        delivery_country: input.shippingAddress.country,
        delivery_pincode: input.shippingAddress.postalCode,
        delivery_phone: input.customerPhone,
        is_document: false,
        length: input.length ?? 10,
        breadth: input.width ?? 10,
        height: input.height ?? 10,
        weight: input.weight ?? 0.5,
      });
      return {
        success: true,
        shipmentId: data.shipment_id?.toString(),
        trackingNumber: data.awb_code,
        courier: data.courier_name ?? input.courier,
        labelUrl: data.label_url,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Shiprocket API error" };
    }
  },

  async generateLabel(input: GenerateLabelInput): Promise<GenerateLabelResult> {
    try {
      const data = await request("POST", "/shipments/generate/label", {
        shipment_id: input.shipmentId,
      });
      return {
        success: true,
        labelUrl: data.label_url,
        qrCode: data.qr_code_url,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Label generation failed" };
    }
  },

  async schedulePickup(input: SchedulePickupInput): Promise<SchedulePickupResult> {
    try {
      const data = await request("POST", "/courier/generate/pickup", {
        shipment_id: input.shipmentId,
        pickup_date: input.scheduledAt,
        pickup_time: input.pickupTime ?? "10:00-17:00",
      });
      return {
        success: true,
        pickupRequestId: data.pickup_id?.toString(),
        scheduledAt: input.scheduledAt,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Pickup scheduling failed" };
    }
  },

  async cancelPickup(input: CancelPickupInput): Promise<CancelPickupResult> {
    try {
      await request("POST", "/courier/cancel/pickup", {
        shipment_id: input.shipmentId,
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Pickup cancellation failed" };
    }
  },

  async trackShipment(trackingNumber: string): Promise<TrackShipmentResult> {
    try {
      const data = await request("GET", `/courier/track?awb=${trackingNumber}`);
      const trackingData = data.tracking_data ?? data;
      return {
        success: true,
        currentStatus: trackingData.current_status ?? "unknown",
        estimatedDelivery: trackingData.etd,
        events: (trackingData.track ?? []).map((e: Record<string, string>) => ({
          status: e.status,
          location: e.location,
          description: e.activity,
          courierUpdate: e.status,
          timestamp: e.date,
        })),
      };
    } catch (err) {
      return { success: false, currentStatus: "error", events: [], error: err instanceof Error ? err.message : "Tracking failed" };
    }
  },

  async cancelShipment(trackingNumber: string): Promise<CancelShipmentResult> {
    try {
      await request("POST", "/shipments/cancel", {
        awb: trackingNumber,
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Shipment cancellation failed" };
    }
  },

  async getShippingRate(input: ShippingRateInput): Promise<ShippingRateResult> {
    try {
      const data = await request("POST", "/courier/serviceability", {
        delivery_postcode: input.destinationPostalCode,
        weight: input.weight,
        ...(input.dimensions ?? {}),
      });
      return {
        success: true,
        rates: (data.available_courier ?? []).map((c: Record<string, unknown>) => ({
          courier: String(c.courier_name ?? ""),
          estimatedCost: Number(c.rate ?? 0),
          estimatedDays: Number(c.etd ?? 5),
        })),
      };
    } catch (err) {
      return { success: false, rates: [], error: err instanceof Error ? err.message : "Rate fetch failed" };
    }
  },
};