export const EventTypes = {
  PRODUCT_CREATED: "product.created",
  PRODUCT_UPDATED: "product.updated",
  PRODUCT_DELETED: "product.deleted",

  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_PAID: "order.paid",
  ORDER_CONFIRMED: "order.confirmed",
  ORDER_PACKED: "order.packed",
  ORDER_DISPATCHED: "order.dispatched",
  ORDER_DELIVERED: "order.delivered",
  ORDER_CANCELLED: "order.cancelled",
  ORDER_RETURNED: "order.returned",
  ORDER_REFUNDED: "order.refunded",
  ORDER_STATUS_CHANGED: "order.status_changed",

  INVENTORY_DECREMENTED: "inventory.decremented",
  INVENTORY_RESTORED: "inventory.restored",
  INVENTORY_UPDATED: "inventory.updated",
  INVENTORY_LOW_STOCK: "inventory.low_stock",
  INVENTORY_OUT_OF_STOCK: "inventory.out_of_stock",

  REVIEW_CREATED: "review.created",
  REVIEW_APPROVED: "review.approved",
  REVIEW_REJECTED: "review.rejected",

  COUPON_CREATED: "coupon.created",
  COUPON_USAGE_INCREMENTED: "coupon.usage_incremented",

  CATEGORY_CREATED: "category.created",
  CATEGORY_UPDATED: "category.updated",
  CATEGORY_DELETED: "category.deleted",

  COLLECTION_CREATED: "collection.created",
  COLLECTION_UPDATED: "collection.updated",
  COLLECTION_DELETED: "collection.deleted",

  CONTACT_SUBMITTED: "contact.submitted",

  CACHE_INVALIDATED: "cache.invalidated",
  SITEMAP_REGENERATED: "sitemap.regenerated",

  PAYMENT_CREATED: "payment.created",
  PAYMENT_PENDING: "payment.pending",
  PAYMENT_SUCCESS: "payment.success",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_CANCELLED: "payment.cancelled",
  PAYMENT_REFUNDED: "payment.refunded",
  PAYMENT_CAPTURED: "payment.captured",
  PAYMENT_WEBHOOK_RECEIVED: "payment.webhook_received",

  SHIPMENT_CREATED: "shipment.created",
  LABEL_GENERATED: "shipment.label_generated",
  PICKUP_SCHEDULED: "shipment.pickup_scheduled",
  PICKUP_COMPLETED: "shipment.pickup_completed",
  SHIPMENT_IN_TRANSIT: "shipment.in_transit",
  OUT_FOR_DELIVERY: "shipment.out_for_delivery",
  DELIVERED: "shipment.delivered",
  DELIVERY_FAILED: "shipment.delivery_failed",
  RETURN_TO_ORIGIN: "shipment.return_to_origin",
  SHIPMENT_CANCELLED: "shipment.cancelled",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export interface BaseEventPayload {
  entityType: string;
  entityId: string;
  correlationId?: string;
  actor?: string;
  [key: string]: unknown;
}

export interface ProductEventPayload extends BaseEventPayload {
  entityType: "product";
  productSlug?: string;
  productName?: string;
  categorySlug?: string;
}

export interface OrderEventPayload extends BaseEventPayload {
  entityType: "order";
  orderNumber?: string;
  status?: string;
  previousStatus?: string;
  customerEmail?: string;
  total?: number;
  reason?: string;
  items?: Array<{ productId: string; quantity: number }>;
}

export interface InventoryEventPayload extends BaseEventPayload {
  entityType: "product";
  quantity?: number;
  previousStock?: number;
  newStock?: number;
  operation?: string;
  reason?: string;
  performedBy?: string;
}

export interface InventoryUpdatedPayload extends BaseEventPayload {
  entityType: "product";
  operation: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  performedBy: string;
  productName?: string;
}

export interface ReviewEventPayload extends BaseEventPayload {
  entityType: "review";
  productId?: string;
  rating?: number;
  isApproved?: boolean;
}

export interface CouponEventPayload extends BaseEventPayload {
  entityType: "coupon";
  code?: string;
}

export interface CategoryEventPayload extends BaseEventPayload {
  entityType: "category";
  categorySlug?: string;
}

export interface CollectionEventPayload extends BaseEventPayload {
  entityType: "collection";
  collectionSlug?: string;
}

export interface ContactEventPayload extends BaseEventPayload {
  entityType: "contact";
  email?: string;
  name?: string;
}

export interface PaymentEventPayload extends BaseEventPayload {
  entityType: "payment";
  orderId?: string;
  provider?: string;
  amount?: number;
  currency?: string;
  status?: string;
  method?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
}

export interface ShippingEventPayload extends BaseEventPayload {
  entityType: "shipment";
  orderId?: string;
  trackingNumber?: string;
  courier?: string;
  status?: string;
  estimatedDelivery?: string;
  location?: string;
}

export type EventPayload =
  | ProductEventPayload
  | OrderEventPayload
  | InventoryEventPayload
  | InventoryUpdatedPayload
  | ReviewEventPayload
  | CouponEventPayload
  | CategoryEventPayload
  | CollectionEventPayload
  | ContactEventPayload
  | PaymentEventPayload
  | ShippingEventPayload;

export interface DomainEvent {
  type: EventType;
  payload: EventPayload;
  timestamp: string;
  id: string;
  version?: number;
  correlationId?: string;
  causationId?: string;
  source?: string;
  actor?: string;
}