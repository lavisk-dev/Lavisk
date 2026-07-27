import type { ShippingProvider, CreateShipmentInput, CreateShipmentResult, GenerateLabelInput, GenerateLabelResult, SchedulePickupInput, SchedulePickupResult, CancelPickupInput, CancelPickupResult, TrackShipmentResult, CancelShipmentResult, ShippingRateInput, ShippingRateResult } from "../types";
import { config } from "@/lib/core/config";

const apiKey = config.get("DTDC_API_KEY");

export const DTDCProvider: ShippingProvider = {
  name: "dtdc",
  isConfigured: () => Boolean(apiKey),
  async createShipment(_input: CreateShipmentInput): Promise<CreateShipmentResult> {
    throw new Error("DTDC provider is not yet implemented.");
  },
  async generateLabel(_input: GenerateLabelInput): Promise<GenerateLabelResult> {
    throw new Error("DTDC provider is not yet implemented.");
  },
  async schedulePickup(_input: SchedulePickupInput): Promise<SchedulePickupResult> {
    throw new Error("DTDC provider is not yet implemented.");
  },
  async cancelPickup(_input: CancelPickupInput): Promise<CancelPickupResult> {
    throw new Error("DTDC provider is not yet implemented.");
  },
  async trackShipment(_trackingNumber: string): Promise<TrackShipmentResult> {
    throw new Error("DTDC provider is not yet implemented.");
  },
  async cancelShipment(_trackingNumber: string): Promise<CancelShipmentResult> {
    throw new Error("DTDC provider is not yet implemented.");
  },
  async getShippingRate(_input: ShippingRateInput): Promise<ShippingRateResult> {
    throw new Error("DTDC provider is not yet implemented.");
  },
};