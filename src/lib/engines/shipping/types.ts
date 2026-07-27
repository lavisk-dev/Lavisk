export type GetShippingProviderFn = () => ShippingProvider;

export interface CreateShipmentInput {
  orderId: string;
  courier: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  items: Array<{ productId: string; name: string; quantity: number }>;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  isReturn?: boolean;
  returnReason?: string;
  notes?: string;
}

export interface CreateShipmentResult {
  success: boolean;
  shipmentId?: string;
  trackingNumber?: string;
  courier?: string;
  labelUrl?: string;
  error?: string;
}

export interface GenerateLabelInput {
  shipmentId: string;
  format?: string;
}

export interface GenerateLabelResult {
  success: boolean;
  labelUrl?: string;
  packingSlipUrl?: string;
  invoiceUrl?: string;
  qrCode?: string;
  barcode?: string;
  error?: string;
}

export interface SchedulePickupInput {
  shipmentId: string;
  scheduledAt: string;
  pickupAddress: string;
  pickupTime?: string;
}

export interface SchedulePickupResult {
  success: boolean;
  pickupRequestId?: string;
  scheduledAt?: string;
  error?: string;
}

export interface CancelPickupInput {
  shipmentId: string;
  reason?: string;
}

export interface CancelPickupResult {
  success: boolean;
  error?: string;
}

export interface TrackShipmentInput {
  trackingNumber: string;
}

export interface TrackShipmentResult {
  success: boolean;
  currentStatus: string;
  estimatedDelivery?: string;
  events: Array<{
    status: string;
    location?: string;
    description?: string;
    courierUpdate?: string;
    timestamp: string;
  }>;
  error?: string;
}

export interface CancelShipmentInput {
  trackingNumber: string;
  reason?: string;
}

export interface CancelShipmentResult {
  success: boolean;
  error?: string;
}

export interface ShippingRateInput {
  weight: number;
  dimensions?: { length: number; width: number; height: number };
  destinationPostalCode: string;
  destinationCountry: string;
  courier?: string;
}

export interface ShippingRateResult {
  success: boolean;
  rates: Array<{
    courier: string;
    estimatedCost: number;
    estimatedDays: number;
  }>;
  error?: string;
}

export interface ShippingProvider {
  name: string;
  isConfigured(): boolean;
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  generateLabel(input: GenerateLabelInput): Promise<GenerateLabelResult>;
  schedulePickup(input: SchedulePickupInput): Promise<SchedulePickupResult>;
  cancelPickup(input: CancelPickupInput): Promise<CancelPickupResult>;
  trackShipment(trackingNumber: string): Promise<TrackShipmentResult>;
  cancelShipment(trackingNumber: string): Promise<CancelShipmentResult>;
  getShippingRate(input: ShippingRateInput): Promise<ShippingRateResult>;
}