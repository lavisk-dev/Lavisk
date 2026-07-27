import "server-only";
import { ShipmentService } from "./shipment.service";
import { TrackingService } from "./tracking.service";
import { PickupService } from "./pickup.service";
import { LabelService } from "./label.service";
import { getShippingProvider } from "./providers";
import { validateCreateShipment } from "./validators";
import { logger } from "@/lib/core/logging";
import { NotFoundError, BusinessRuleError } from "@/lib/core/errors";
import type { Shipment, ShipmentStatus } from "@/lib/types";
import type { CreateShipmentInput } from "./types";

function publishEvent(type: string, shipment: Shipment, extra?: Record<string, unknown>): void {
  logger.info("Shipping event (not dispatched to EventBus)", { 
    event: type, 
    entityId: shipment.id, 
    metadata: { 
      orderId: shipment.orderId, 
      trackingNumber: shipment.trackingNumber, 
      courier: shipment.courier, 
      status: shipment.status, 
      ...extra 
    } 
  });
}

export const ShippingEngine = {
  async createShipment(input: CreateShipmentInput): Promise<Shipment> {
    validateCreateShipment(input);

    const provider = getShippingProvider();
    const shipment = await ShipmentService.create({
      orderId: input.orderId,
      courier: input.courier,
      provider: provider.name,
      weight: input.weight,
      length: input.length,
      width: input.width,
      height: input.height,
      dimensionUnit: input.dimensionUnit,
      isReturn: input.isReturn,
      returnReason: input.returnReason,
      notes: input.notes,
    });

    const providerResult = await provider.createShipment(input);

    if (providerResult.success && providerResult.trackingNumber) {
      const updates: Partial<Shipment> = {
        trackingNumber: providerResult.trackingNumber,
        courier: providerResult.courier ?? input.courier,
        labelUrl: providerResult.labelUrl ?? null,
        status: "label_generated",
      };
      await ShipmentService.update(shipment.id, updates);
      Object.assign(shipment, updates);

      await TrackingService.addEvent({
        shipmentId: shipment.id,
        status: "label_generated",
        description: "Shipment created and label generated",
      });

      if (providerResult.labelUrl) {
        await LabelService.save({
          shipmentId: shipment.id,
          url: providerResult.labelUrl,
        });
      }

      publishEvent("shipment.created", shipment);
      if (providerResult.labelUrl) {
        publishEvent("shipment.label_generated", shipment);
      }
    } else {
      await ShipmentService.update(shipment.id, {
        notes: `Provider error: ${providerResult.error ?? "Unknown"}`,
      });
    }

    return shipment;
  },

  async createFromOrder(
    orderId: string,
    extra: {
      courier: string;
      items: Array<{ productId: string; name: string; quantity: number }>;
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      shippingAddress: { line1: string; line2?: string; city: string; state: string; postalCode: string; country: string };
    }
  ): Promise<Shipment> {
    const existing = await ShipmentService.getByOrderId(orderId);
    if (existing.some((s) => s.status !== "cancelled")) {
      throw new BusinessRuleError(`Order ${orderId} already has active shipments`);
    }

    return ShippingEngine.createShipment({
      orderId,
      courier: extra.courier,
      items: extra.items,
      customerName: extra.customerName,
      customerPhone: extra.customerPhone,
      customerEmail: extra.customerEmail,
      shippingAddress: extra.shippingAddress,
    });
  },

  async generateLabel(shipmentId: string): Promise<Shipment> {
    const shipment = await ShipmentService.getById(shipmentId);
    if (!shipment) throw new NotFoundError(`Shipment ${shipmentId} not found`);

    const provider = getShippingProvider();
    const result = await provider.generateLabel({ shipmentId });

    if (result.success) {
      const updates: Partial<Shipment> = {
        labelUrl: result.labelUrl ?? shipment.labelUrl,
        packingSlipUrl: result.packingSlipUrl ?? shipment.packingSlipUrl,
        invoiceUrl: result.invoiceUrl ?? shipment.invoiceUrl,
        qrCode: result.qrCode ?? shipment.qrCode,
        barcode: result.barcode ?? shipment.barcode,
        status: "label_generated",
      };
      await ShipmentService.update(shipmentId, updates);

      await TrackingService.addEvent({
        shipmentId,
        status: "label_generated",
        description: "Shipping label generated",
      });

      if (result.labelUrl) {
        await LabelService.save({ shipmentId, url: result.labelUrl });
      }

      const updated = await ShipmentService.getById(shipmentId);
      if (updated) {
        publishEvent("shipment.label_generated", updated);
        return updated;
      }
    }

    return shipment;
  },

  async schedulePickup(shipmentId: string, scheduledAt: string, pickupTime?: string): Promise<Shipment> {
    const shipment = await ShipmentService.getById(shipmentId);
    if (!shipment) throw new NotFoundError(`Shipment ${shipmentId} not found`);

    const provider = getShippingProvider();
    const result = await provider.schedulePickup({
      shipmentId,
      scheduledAt,
      pickupAddress: "Lavisk Warehouse",
      pickupTime,
    });

    if (result.success) {
      await ShipmentService.update(shipmentId, {
        pickupStatus: "scheduled",
        pickupScheduledAt: result.scheduledAt ?? scheduledAt,
        status: "pickup_scheduled",
      });

      await PickupService.create({
        shipmentId,
        scheduledAt: result.scheduledAt ?? scheduledAt,
        pickupAddress: "Lavisk Warehouse",
        pickupTime,
      });

      await TrackingService.addEvent({
        shipmentId,
        status: "pickup_scheduled",
        description: `Pickup scheduled for ${scheduledAt}`,
      });

      const updated = await ShipmentService.getById(shipmentId);
      if (updated) {
        publishEvent("shipment.pickup_scheduled", updated);
        return updated;
      }
    }

    return shipment;
  },

  async markPickedUp(shipmentId: string): Promise<Shipment> {
    const shipment = await ShipmentService.getById(shipmentId);
    if (!shipment) throw new NotFoundError(`Shipment ${shipmentId} not found`);

    await ShipmentService.update(shipmentId, {
      status: "picked_up",
      pickupStatus: "completed",
      pickedUpAt: new Date().toISOString(),
    });

    await TrackingService.addEvent({
      shipmentId,
      status: "picked_up",
      description: "Package picked up from warehouse",
    });

    const updated = await ShipmentService.getById(shipmentId);
    if (updated) publishEvent("shipment.pickup_completed", updated);
    return updated ?? shipment;
  },

  async updateTracking(
    shipmentId: string,
    status: ShipmentStatus,
    data?: { location?: string; description?: string; courierUpdate?: string; estimatedDelivery?: string }
  ): Promise<Shipment> {
    const shipment = await ShipmentService.getById(shipmentId);
    if (!shipment) throw new NotFoundError(`Shipment ${shipmentId} not found`);

    const updates: Partial<Shipment> = { status };

    if (data?.estimatedDelivery) updates.estimatedDelivery = data.estimatedDelivery;

    if (status === "delivered") updates.deliveredAt = new Date().toISOString();

    await ShipmentService.update(shipmentId, updates);

    await TrackingService.addEvent({
      shipmentId,
      status,
      location: data?.location,
      description: data?.description,
      courierUpdate: data?.courierUpdate,
    });

    const updated = await ShipmentService.getById(shipmentId) ?? { ...shipment, ...updates };

    switch (status) {
      case "in_transit":
        publishEvent("shipment.in_transit", updated);
        break;
      case "out_for_delivery":
        publishEvent("shipment.out_for_delivery", updated);
        break;
      case "delivered":
        publishEvent("shipment.delivered", updated);
        break;
      case "delivery_failed":
        publishEvent("shipment.delivery_failed", updated, { location: data?.description });
        break;
      case "returned":
        publishEvent("shipment.return_to_origin", updated);
        break;
      case "cancelled":
        publishEvent("shipment.cancelled", updated);
        break;
    }

    return updated;
  },

  async cancelForOrder(orderId: string): Promise<void> {
    const shipments = await ShipmentService.getByOrderId(orderId);
    for (const shipment of shipments) {
      if (shipment.status === "delivered" || shipment.status === "cancelled") continue;

      const provider = getShippingProvider();
      if (shipment.trackingNumber) {
        await provider.cancelShipment(shipment.trackingNumber);
      }

      await ShipmentService.update(shipment.id, { status: "cancelled" });

      await TrackingService.addEvent({
        shipmentId: shipment.id,
        status: "cancelled",
        description: "Shipment cancelled due to order cancellation",
      });

      publishEvent("shipment.cancelled", { ...shipment, status: "cancelled" });
    }
  },

  async createReturnShipment(orderId: string): Promise<Shipment | null> {
    const shipments = await ShipmentService.getByOrderId(orderId);
    const original = shipments.find((s) => s.status === "delivered");
    if (!original) throw new BusinessRuleError(`No delivered shipment found for order ${orderId}`);

    const input: CreateShipmentInput = {
      orderId,
      courier: original.courier,
      items: [],
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      shippingAddress: { line1: "", city: "", state: "", postalCode: "", country: "" },
      isReturn: true,
      returnReason: "Customer return",
    };

    const returnShipment = await ShippingEngine.createShipment(input);

    logger.info("Return shipment created", { entityId: orderId });
    return returnShipment;
  },

  async getShipmentDetail(shipmentId: string): Promise<{
    shipment: Shipment;
    tracking: import("@/lib/types").TrackingEvent[];
    labels: import("@/lib/types").ShippingLabel[];
    pickup: import("@/lib/types").PickupRequest | null;
  } | null> {
    const shipment = await ShipmentService.getById(shipmentId);
    if (!shipment) return null;

    const [tracking, labels, pickup] = await Promise.all([
      TrackingService.getByShipmentId(shipmentId),
      LabelService.getByShipmentId(shipmentId),
      PickupService.getByShipmentId(shipmentId),
    ]);

    return { shipment, tracking, labels, pickup };
  },

  async getDashboard(): Promise<{
    stats: { total: number; pending: number; inTransit: number; delivered: number; failed: number; returned: number };
    recentShipments: Shipment[];
  }> {
    return ShipmentService.getDashboard();
  },
};