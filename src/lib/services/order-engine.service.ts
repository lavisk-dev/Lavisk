import "server-only";
import { OrderService } from "@/lib/services/order.service";
import { OrderTimelineService } from "@/lib/services/order-timeline.service";
import { EventBus, EventTypes, type EventType } from "@/lib/services/automation";
import type { Order, OrderDetail, OrderStatus } from "@/lib/types";

function getEventForStatus(status: OrderStatus): string | null {
  const map: Record<string, string> = {
    confirmed: EventTypes.ORDER_CONFIRMED,
    packed: EventTypes.ORDER_PACKED,
    dispatched: EventTypes.ORDER_DISPATCHED,
    delivered: EventTypes.ORDER_DELIVERED,
    cancelled: EventTypes.ORDER_CANCELLED,
    returned: EventTypes.ORDER_RETURNED,
    refunded: EventTypes.ORDER_REFUNDED,
  };
  return map[status] ?? null;
}

export const OrderEngine = {
  async getOrderDetail(id: string): Promise<OrderDetail | null> {
    const order = await OrderService.getById(id);
    if (!order) return null;
    const timeline = await OrderTimelineService.getByOrderId(id);
    return { ...order, timeline };
  },

  async updateStatus(
    id: string,
    status: OrderStatus,
    performedBy: string,
    note?: string | null
  ): Promise<Order | null> {
    const order = await OrderService.getById(id);
    if (!order) return null;
    if (order.status === status) return order;

    const previousStatus = order.status;

    await OrderTimelineService.addEntry(
      id,
      status,
      previousStatus,
      performedBy,
      note
    );

    const updated = await OrderService.updateStatus(id, status);
    if (!updated) return null;

    EventBus.publish(EventTypes.ORDER_UPDATED, {
      entityType: "order",
      entityId: id,
      orderNumber: order.orderNumber,
      status,
      previousStatus,
      customerEmail: order.customerEmail,
    });

    const eventType = getEventForStatus(status);
    if (eventType) {
      EventBus.publish(eventType as EventType, {
        entityType: "order",
        entityId: id,
        orderNumber: order.orderNumber,
        status,
        previousStatus,
        customerEmail: order.customerEmail,
        items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
    }

    return updated;
  },

  async cancelOrder(
    id: string,
    reason: string,
    performedBy: string
  ): Promise<Order | null> {
    const order = await OrderService.getById(id);
    if (!order) return null;

    const cancellableStatuses: OrderStatus[] = ["pending", "paid", "processing", "packed"];
    if (!cancellableStatuses.includes(order.status)) {
      throw new Error(
        `Order ${order.orderNumber} cannot be cancelled. Current status: ${order.status}`
      );
    }

    const previousStatus = order.status;

    await OrderTimelineService.addEntry(
      id,
      "cancelled",
      previousStatus,
      performedBy,
      reason
    );

    const updated = await OrderService.updateStatus(id, "cancelled");
    if (!updated) return null;

    // Stock restoration is handled by the automation rule on ORDER_STATUS_CHANGED
    // (published by OrderService.updateStatus). No direct InventoryService call needed.

    EventBus.publish(EventTypes.ORDER_UPDATED, {
      entityType: "order",
      entityId: id,
      orderNumber: order.orderNumber,
      status: "cancelled",
      previousStatus,
      customerEmail: order.customerEmail,
    });

    EventBus.publish(EventTypes.ORDER_CANCELLED, {
      entityType: "order",
      entityId: id,
      orderNumber: order.orderNumber,
      status: "cancelled",
      previousStatus,
      customerEmail: order.customerEmail,
      reason,
      items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });

    return updated;
  },

  async refundOrder(
    id: string,
    reason: string,
    performedBy: string
  ): Promise<Order | null> {
    const order = await OrderService.getById(id);
    if (!order) return null;

    if (order.status !== "cancelled") {
      throw new Error(
        `Order ${order.orderNumber} must be cancelled before refunding. Current status: ${order.status}`
      );
    }

    const previousStatus = order.status;

    await OrderTimelineService.addEntry(
      id,
      "refunded",
      previousStatus,
      performedBy,
      reason
    );

    const updated = await OrderService.updateStatus(id, "refunded");
    if (!updated) return null;

    EventBus.publish(EventTypes.ORDER_UPDATED, {
      entityType: "order",
      entityId: id,
      orderNumber: order.orderNumber,
      status: "refunded",
      previousStatus,
      customerEmail: order.customerEmail,
    });

    EventBus.publish(EventTypes.ORDER_REFUNDED, {
      entityType: "order",
      entityId: id,
      orderNumber: order.orderNumber,
      status: "refunded",
      previousStatus,
      customerEmail: order.customerEmail,
      reason,
    });

    return updated;
  },
};