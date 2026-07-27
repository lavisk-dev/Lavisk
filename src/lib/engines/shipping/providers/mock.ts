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

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateTrackingNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "SHIP";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MCK-${result}`;
}

export const MockShippingProvider: ShippingProvider = {
  name: "mock",

  isConfigured(): boolean {
    return true;
  },

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    await new Promise((r) => setTimeout(r, 100));
    return {
      success: true,
      shipmentId: generateId("shp"),
      trackingNumber: generateTrackingNumber(),
      courier: input.courier,
      labelUrl: "https://mock.lavisk.app/labels/sample.pdf",
    };
  },

  async generateLabel(_input: GenerateLabelInput): Promise<GenerateLabelResult> {
    await new Promise((r) => setTimeout(r, 100));
    return {
      success: true,
      labelUrl: "https://mock.lavisk.app/labels/sample.pdf",
      packingSlipUrl: "https://mock.lavisk.app/packing/sample.pdf",
      invoiceUrl: "https://mock.lavisk.app/invoices/sample.pdf",
      qrCode: "https://mock.lavisk.app/qr/sample.png",
      barcode: "https://mock.lavisk.app/barcode/sample.png",
    };
  },

  async schedulePickup(input: SchedulePickupInput): Promise<SchedulePickupResult> {
    await new Promise((r) => setTimeout(r, 100));
    return {
      success: true,
      pickupRequestId: generateId("pck"),
      scheduledAt: input.scheduledAt,
    };
  },

  async cancelPickup(_input: CancelPickupInput): Promise<CancelPickupResult> {
    await new Promise((r) => setTimeout(r, 100));
    return { success: true };
  },

  async trackShipment(_trackingNumber: string): Promise<TrackShipmentResult> {
    await new Promise((r) => setTimeout(r, 100));
    return {
      success: true,
      currentStatus: "in_transit",
      estimatedDelivery: new Date(Date.now() + 3 * 86400000).toISOString(),
      events: [
        {
          status: "picked_up",
          location: "Mumbai Warehouse",
          description: "Package picked up from warehouse",
          courierUpdate: "Shipment received at origin facility",
          timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          status: "in_transit",
          location: "Delhi Sorting Center",
          description: "Package in transit",
          courierUpdate: "Shipment arrived at sorting facility",
          timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
      ],
    };
  },

  async cancelShipment(_trackingNumber: string): Promise<CancelShipmentResult> {
    await new Promise((r) => setTimeout(r, 100));
    return { success: true };
  },

  async getShippingRate(input: ShippingRateInput): Promise<ShippingRateResult> {
    await new Promise((r) => setTimeout(r, 100));
    const baseRate = Math.max(30, Math.round(input.weight * 15));
    return {
      success: true,
      rates: [
        { courier: "mock_standard", estimatedCost: baseRate, estimatedDays: 5 },
        { courier: "mock_express", estimatedCost: baseRate * 2, estimatedDays: 2 },
      ],
    };
  },
};