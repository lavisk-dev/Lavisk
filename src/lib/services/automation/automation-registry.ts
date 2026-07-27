import "server-only";
import type { NotificationTemplateType, NotificationEvent } from "@/lib/types";
import { EventBus } from "./event-bus";
import { ActivityLog } from "./activity-log";
import { EventTypes, type EventType, type DomainEvent, type InventoryUpdatedPayload } from "./event-types";
import { config } from "@/lib/core/config";

export type FailureStrategy = "ignore" | "retry" | "abort" | "rollback";

export interface AutomationAction {
  name: string;
  execute: (event: DomainEvent) => Promise<void>;
  onFailure?: FailureStrategy;
}

export interface AutomationRule {
  event: EventType;
  description: string;
  condition?: (event: DomainEvent) => boolean | Promise<boolean>;
  actions: AutomationAction[];
}

const rules: AutomationRule[] = [];

function registerRule(rule: AutomationRule): void {
  rules.push(rule);
  EventBus.on(rule.event, async (event) => {
    if (rule.condition) {
      try {
        const passes = await Promise.resolve(rule.condition(event));
        if (!passes) {
          await ActivityLog.log({
            event: event.type,
            entityType: event.payload.entityType,
            entityId: event.payload.entityId,
            action: `${rule.actions.map((a) => a.name).join(", ")}`,
            actor: "system",
            result: "skipped",
            metadata: { reason: "Condition not met", eventData: event.payload },
          });
          return;
        }
      } catch {
        return;
      }
    }

    for (const action of rule.actions) {
      try {
        await action.execute(event);
        await ActivityLog.log({
          event: event.type,
          entityType: event.payload.entityType,
          entityId: event.payload.entityId,
          action: action.name,
          actor: "system",
          result: "success",
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await ActivityLog.log({
          event: event.type,
          entityType: event.payload.entityType,
          entityId: event.payload.entityId,
          action: action.name,
          actor: "system",
          result: "failure",
          error: errorMessage,
        });
      }
    }
  });
}

export const AutomationRegistry = {
  initialize(): void {
    registerRule({
      event: EventTypes.ORDER_PAID,
      description: "Decrement inventory for each item in a paid order",
      actions: [
        {
          name: "Decrement stock",
          execute: async (event) => {
            const { ProductService } = await import("@/lib/services/product.service");
            const items = event.payload.items as Array<{ productId: string; quantity: number }> | undefined;
            if (items) {
              for (const item of items) {
                await ProductService.decrementStock(item.productId, item.quantity);
              }
            }
          },
          onFailure: "abort",
        },
      ],
    });

    registerRule({
      event: EventTypes.ORDER_PAID,
      description: "Send order confirmation email to customer",
      condition: (event) => {
        const payload = event.payload as { entityType: string; customerEmail?: string };
        return Boolean(payload.customerEmail);
      },
      actions: [
        {
          name: "Send confirmation email",
          execute: async (event) => {
            const { OrderService } = await import("@/lib/services/order.service");
            const { sendOrderConfirmationEmail } = await import("@/lib/services/email/resend");
            const order = await OrderService.getById(event.payload.entityId);
            if (order) {
              await sendOrderConfirmationEmail(order);
            }
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.ORDER_PAID,
      description: "Send admin notification for new paid order",
      actions: [
        {
          name: "Admin notification email",
          execute: async (event) => {
            const { OrderService } = await import("@/lib/services/order.service");
            const { sendAdminOrderNotification } = await import("@/lib/services/email/resend");
            const order = await OrderService.getById(event.payload.entityId);
            if (order) {
              await sendAdminOrderNotification(order);
            }
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.ORDER_PAID,
      description: "Increment coupon usage if a coupon was applied",
      condition: (event) => {
        const payload = event.payload as { entityType: string; items?: Array<{ productId: string; quantity: number }> };
        return !payload.items;
      },
      actions: [
        {
          name: "Increment coupon usage",
          execute: async (event) => {
            const { OrderService } = await import("@/lib/services/order.service");
            const order = await OrderService.getById(event.payload.entityId);
            if (order?.couponCode) {
              const { CouponService } = await import("@/lib/services/coupon.service");
              const coupons = await CouponService.list();
              const coupon = coupons.find((c) => c.code.toLowerCase() === order.couponCode!.toLowerCase());
              if (coupon) {
                await CouponService.incrementUsage(coupon.id);
              }
            }
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.ORDER_STATUS_CHANGED,
      description: "Restore inventory when order is cancelled",
      condition: (event) => event.payload.status === "cancelled",
      actions: [
        {
          name: "Restore stock",
          execute: async (event) => {
            const { OrderService } = await import("@/lib/services/order.service");
            const order = await OrderService.getById(event.payload.entityId);
            if (order && order.status !== "pending") {
              const { InventoryService } = await import("@/lib/services/inventory.service");
              for (const item of order.items) {
                await InventoryService.addStock(
                  item.productId,
                  item.quantity,
                  `Order cancelled: ${order.orderNumber}`,
                  "system",
                  { reference: order.id }
                );
              }
            }
          },
          onFailure: "abort",
        },
      ],
    });

    registerRule({
      event: EventTypes.ORDER_UPDATED,
      description: "Log order status change to activity log",
      actions: [
        {
          name: "Log order update",
          execute: async (event) => {
            const payload = event.payload as { status?: string; previousStatus?: string; orderNumber?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "order",
              entityId: event.payload.entityId,
              action: `Status changed: ${payload.previousStatus ?? "?"} → ${payload.status ?? "?"}`,
              actor: "system",
              result: "success",
              metadata: { orderNumber: payload.orderNumber },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.ORDER_CANCELLED,
      description: "Log order cancellation",
      actions: [
        {
          name: "Cancel log",
          execute: async (event) => {
            const payload = event.payload as { orderNumber?: string; reason?: string; previousStatus?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "order",
              entityId: event.payload.entityId,
              action: `Order cancelled: ${payload.reason ?? "No reason provided"}`,
              actor: "system",
              result: "success",
              metadata: { orderNumber: payload.orderNumber, reason: payload.reason, previousStatus: payload.previousStatus },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.ORDER_REFUNDED,
      description: "Log order refund",
      actions: [
        {
          name: "Refund log",
          execute: async (event) => {
            const payload = event.payload as { orderNumber?: string; reason?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "order",
              entityId: event.payload.entityId,
              action: `Order refunded: ${payload.reason ?? "No reason provided"}`,
              actor: "system",
              result: "success",
              metadata: { orderNumber: payload.orderNumber, reason: payload.reason },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.ORDER_DISPATCHED,
      description: "Log dispatch",
      actions: [
        {
          name: "Dispatch log",
          execute: async (event) => {
            const payload = event.payload as { orderNumber?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "order",
              entityId: event.payload.entityId,
              action: `Order dispatched`,
              actor: "system",
              result: "success",
              metadata: { orderNumber: payload.orderNumber },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.ORDER_DELIVERED,
      description: "Log delivery",
      actions: [
        {
          name: "Delivery log",
          execute: async (event) => {
            const payload = event.payload as { orderNumber?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "order",
              entityId: event.payload.entityId,
              action: `Order delivered`,
              actor: "system",
              result: "success",
              metadata: { orderNumber: payload.orderNumber },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.INVENTORY_LOW_STOCK,
      description: "Log low stock warning",
      actions: [
        {
          name: "Low stock log",
          execute: async (event) => {
            const payload = event.payload as { productId?: string; previousStock?: number; newStock?: number };
            await ActivityLog.log({
              event: event.type,
              entityType: "product",
              entityId: event.payload.entityId,
              action: `Low stock: ${payload.newStock ?? 0} remaining`,
              actor: "system",
              result: "success",
              metadata: { previousStock: payload.previousStock, newStock: payload.newStock },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.INVENTORY_UPDATED,
      description: "Log inventory change to activity log",
      actions: [
        {
          name: "Log inventory update",
          execute: async (event) => {
            const payload = event.payload as InventoryUpdatedPayload;
            if (!payload) return;
            const direction = payload.stockAfter > payload.stockBefore ? "increased" : "decreased";
            await ActivityLog.log({
              event: event.type,
              entityType: "product",
              entityId: payload.entityId,
              action: `Stock ${direction}: ${payload.operation} (${payload.quantity} units)`,
              actor: payload.performedBy === "system" ? "system" : "admin",
              result: "success",
              metadata: {
                operation: payload.operation,
                quantity: payload.quantity,
                stockBefore: payload.stockBefore,
                stockAfter: payload.stockAfter,
                reason: payload.reason,
              },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.INVENTORY_OUT_OF_STOCK,
      description: "Log out-of-stock event",
      actions: [
        {
          name: "Out of stock alert",
          execute: async (event) => {
            const payload = event.payload as { productId?: string; previousStock?: number };
            await ActivityLog.log({
              event: event.type,
              entityType: "product",
              entityId: event.payload.entityId,
              action: `Out of stock`,
              actor: "system",
              result: "success",
              metadata: { previousStock: payload.previousStock },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.INVENTORY_DECREMENTED,
      description: "Log inventory decrement",
      actions: [
        {
          name: "Log inventory decrement",
          execute: async (event) => {
            const payload = event.payload as { quantity?: number; previousStock?: number; newStock?: number };
            await ActivityLog.log({
              event: event.type,
              entityType: "product",
              entityId: event.payload.entityId,
              action: `Stock decremented by ${payload.quantity ?? 0}`,
              actor: "system",
              result: "success",
              metadata: { quantity: payload.quantity, previousStock: payload.previousStock, newStock: payload.newStock },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    // ============================================================
    // Product events
    // ============================================================

    registerRule({
      event: EventTypes.PRODUCT_CREATED,
      description: "Log product creation",
      actions: [
        {
          name: "Log product created",
          execute: async (event) => {
            const payload = event.payload as { productName?: string; productSlug?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "product",
              entityId: event.payload.entityId,
              action: `Product created: ${payload.productName ?? "?"}`,
              actor: "admin",
              result: "success",
              metadata: { productSlug: payload.productSlug },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.PRODUCT_UPDATED,
      description: "Log product update",
      actions: [
        {
          name: "Log product updated",
          execute: async (event) => {
            const payload = event.payload as { productName?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "product",
              entityId: event.payload.entityId,
              action: `Product updated: ${payload.productName ?? "?"}`,
              actor: "admin",
              result: "success",
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.PRODUCT_DELETED,
      description: "Log product deletion",
      actions: [
        {
          name: "Log product deleted",
          execute: async (event) => {
            await ActivityLog.log({
              event: event.type,
              entityType: "product",
              entityId: event.payload.entityId,
              action: "Product deleted",
              actor: "admin",
              result: "success",
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    // ============================================================
    // Order events (catch-up rules)
    // ============================================================

    registerRule({
      event: EventTypes.ORDER_CREATED,
      description: "Log order creation",
      actions: [
        {
          name: "Log order created",
          execute: async (event) => {
            const payload = event.payload as { orderNumber?: string; total?: number; customerEmail?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "order",
              entityId: event.payload.entityId,
              action: `Order created: ${payload.orderNumber ?? "?"} (${payload.total ?? 0})`,
              actor: "customer",
              result: "success",
              metadata: { orderNumber: payload.orderNumber, total: payload.total, customerEmail: payload.customerEmail },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    // ============================================================
    // Review events
    // ============================================================

    registerRule({
      event: EventTypes.REVIEW_CREATED,
      description: "Log review submission",
      actions: [
        {
          name: "Log review created",
          execute: async (event) => {
            const payload = event.payload as { productId?: string; rating?: number };
            await ActivityLog.log({
              event: event.type,
              entityType: "review",
              entityId: event.payload.entityId,
              action: `Review submitted for product ${payload.productId ?? "?"} (${payload.rating ?? 0}★)`,
              actor: "customer",
              result: "success",
              metadata: { productId: payload.productId, rating: payload.rating },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.REVIEW_APPROVED,
      description: "Log review approval",
      actions: [
        {
          name: "Log review approved",
          execute: async (event) => {
            const payload = event.payload as { productId?: string; rating?: number };
            await ActivityLog.log({
              event: event.type,
              entityType: "review",
              entityId: event.payload.entityId,
              action: `Review approved for product ${payload.productId ?? "?"}`,
              actor: "admin",
              result: "success",
              metadata: { productId: payload.productId, rating: payload.rating },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.REVIEW_REJECTED,
      description: "Log review rejection",
      actions: [
        {
          name: "Log review rejected",
          execute: async (event) => {
            const payload = event.payload as { productId?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "review",
              entityId: event.payload.entityId,
              action: `Review rejected for product ${payload.productId ?? "?"}`,
              actor: "admin",
              result: "failure",
              metadata: { productId: payload.productId },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    // ============================================================
    // Coupon events
    // ============================================================

    registerRule({
      event: EventTypes.COUPON_CREATED,
      description: "Log coupon creation",
      actions: [
        {
          name: "Log coupon created",
          execute: async (event) => {
            const payload = event.payload as { code?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "coupon",
              entityId: event.payload.entityId,
              action: `Coupon created: ${payload.code ?? "?"}`,
              actor: "admin",
              result: "success",
              metadata: { code: payload.code },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.COUPON_USAGE_INCREMENTED,
      description: "Log coupon usage",
      actions: [
        {
          name: "Log coupon usage",
          execute: async (event) => {
            const payload = event.payload as { code?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "coupon",
              entityId: event.payload.entityId,
              action: `Coupon used: ${payload.code ?? "?"}`,
              actor: "customer",
              result: "success",
              metadata: { code: payload.code },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    // ============================================================
    // Category events
    // ============================================================

    registerRule({
      event: EventTypes.CATEGORY_CREATED,
      description: "Log category creation",
      actions: [
        {
          name: "Log category created",
          execute: async (event) => {
            const payload = event.payload as { categorySlug?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "category",
              entityId: event.payload.entityId,
              action: `Category created: ${payload.categorySlug ?? "?"}`,
              actor: "admin",
              result: "success",
              metadata: { categorySlug: payload.categorySlug },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.CATEGORY_UPDATED,
      description: "Log category update",
      actions: [
        {
          name: "Log category updated",
          execute: async (event) => {
            const payload = event.payload as { categorySlug?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "category",
              entityId: event.payload.entityId,
              action: `Category updated: ${payload.categorySlug ?? "?"}`,
              actor: "admin",
              result: "success",
              metadata: { categorySlug: payload.categorySlug },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.CATEGORY_DELETED,
      description: "Log category deletion",
      actions: [
        {
          name: "Log category deleted",
          execute: async (event) => {
            await ActivityLog.log({
              event: event.type,
              entityType: "category",
              entityId: event.payload.entityId,
              action: "Category deleted",
              actor: "admin",
              result: "success",
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    // ============================================================
    // Contact events
    // ============================================================

    registerRule({
      event: EventTypes.CONTACT_SUBMITTED,
      description: "Log contact form submission",
      actions: [
        {
          name: "Log contact submitted",
          execute: async (event) => {
            const payload = event.payload as { email?: string; name?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "contact",
              entityId: event.payload.entityId,
              action: `Contact form submitted by ${payload.name ?? payload.email ?? "?"}`,
              actor: "customer",
              result: "success",
              metadata: { email: payload.email, name: payload.name },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    // ============================================================
    // Payment events
    // ============================================================

    registerRule({
      event: EventTypes.PAYMENT_CREATED,
      description: "Log payment creation to activity log",
      actions: [
        {
          name: "Log payment created",
          execute: async (event) => {
            const payload = event.payload as { orderId?: string; amount?: number; status?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "payment",
              entityId: event.payload.entityId,
              action: `Payment created for order ${payload.orderId ?? "?"} — ${payload.amount ?? 0}`,
              actor: "system",
              result: "success",
              metadata: { orderId: payload.orderId, amount: payload.amount, status: payload.status },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.PAYMENT_SUCCESS,
      description: "Log successful payment and trigger post-payment actions",
      actions: [
        {
          name: "Log payment success",
          execute: async (event) => {
            const payload = event.payload as { orderId?: string; amount?: number; status?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "payment",
              entityId: event.payload.entityId,
              action: `Payment succeeded for order ${payload.orderId ?? "?"} — ${payload.amount ?? 0}`,
              actor: "system",
              result: "success",
              metadata: { orderId: payload.orderId, amount: payload.amount },
            });
          },
          onFailure: "ignore",
        },
        {
          name: "Analytics: payment success",
          execute: async () => {},
          onFailure: "ignore",
        },
        {
          name: "Notification queue",
          execute: async () => {},
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.PAYMENT_PENDING,
      description: "Log payment pending",
      actions: [
        {
          name: "Log payment pending",
          execute: async (event) => {
            await ActivityLog.log({
              event: event.type,
              entityType: "payment",
              entityId: event.payload.entityId,
              action: "Payment is pending",
              actor: "system",
              result: "success",
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.PAYMENT_FAILED,
      description: "Log payment failure",
      actions: [
        {
          name: "Log payment failure",
          execute: async (event) => {
            const payload = event.payload as { orderId?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "payment",
              entityId: event.payload.entityId,
              action: `Payment failed for order ${payload.orderId ?? "?"}`,
              actor: "system",
              result: "failure",
              metadata: { orderId: payload.orderId },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.PAYMENT_CANCELLED,
      description: "Log payment cancellation",
      actions: [
        {
          name: "Log payment cancelled",
          execute: async (event) => {
            await ActivityLog.log({
              event: event.type,
              entityType: "payment",
              entityId: event.payload.entityId,
              action: "Payment was cancelled",
              actor: "system",
              result: "success",
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.PAYMENT_REFUNDED,
      description: "Log refund and notify",
      actions: [
        {
          name: "Log payment refunded",
          execute: async (event) => {
            const payload = event.payload as { amount?: number; orderId?: string };
            await ActivityLog.log({
              event: event.type,
              entityType: "payment",
              entityId: event.payload.entityId,
              action: `Payment refunded — ${payload.amount ?? 0}`,
              actor: "system",
              result: "success",
              metadata: { amount: payload.amount, orderId: payload.orderId },
            });
          },
          onFailure: "ignore",
        },
        {
          name: "Analytics: refund",
          execute: async () => {},
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.PAYMENT_CAPTURED,
      description: "Log payment capture",
      actions: [
        {
          name: "Log payment captured",
          execute: async (event) => {
            await ActivityLog.log({
              event: event.type,
              entityType: "payment",
              entityId: event.payload.entityId,
              action: "Payment was captured",
              actor: "system",
              result: "success",
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.PAYMENT_WEBHOOK_RECEIVED,
      description: "Log webhook receipt",
      actions: [
        {
          name: "Log webhook",
          execute: async (event) => {
            await ActivityLog.log({
              event: event.type,
              entityType: "payment",
              entityId: event.payload.entityId,
              action: "Webhook received",
              actor: "system",
              result: "success",
              metadata: { provider: event.payload.provider },
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    // ============================================================
    // Notification events — triggered by NotificationEngine
    // ============================================================

    async function notifyCustomer(
      templateType: string,
      event: string,
      orderId: string,
      vars?: Record<string, string | number | boolean | undefined>
    ) {
      try {
        const { OrderService } = await import("@/lib/services/order.service");
        const order = await OrderService.getById(orderId);
        if (!order?.customerEmail) return;
        const { NotificationEngine } = await import("@/lib/services/notification-engine.service");
        await NotificationEngine.sendTemplate(
          templateType as NotificationTemplateType,
          event as NotificationEvent,
          { email: order.customerEmail, name: order.customerName },
          order,
          vars
        );
      } catch {
        // Notification failures are non-blocking
      }
    }

    async function notifyAdmin(
      templateType: string,
      event: string,
      orderId?: string,
      vars?: Record<string, string | number | boolean | undefined>
    ) {
      try {
        const adminEmail = config.email.adminEmail;
        if (!adminEmail) return;
        const { NotificationEngine } = await import("@/lib/services/notification-engine.service");
        let order;
        if (orderId) {
          const { OrderService } = await import("@/lib/services/order.service");
          order = await OrderService.getById(orderId);
        }
        await NotificationEngine.sendTemplate(
          templateType as NotificationTemplateType,
          event as NotificationEvent,
          { email: adminEmail, name: "Admin" },
          order ?? undefined,
          vars
        );
      } catch {
        // Notification failures are non-blocking
      }
    }

    registerRule({
      event: EventTypes.ORDER_CREATED,
      description: "Send customer order confirmation + admin notification",
      actions: [
        {
          name: "Customer order confirmation email",
          execute: async (event) => {
            await notifyCustomer("order_confirmation", event.type, event.payload.entityId);
          },
          onFailure: "ignore",
        },
        {
          name: "Admin new order email",
          execute: async (event) => {
            await notifyAdmin("admin_new_order", event.type, event.payload.entityId);
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.PAYMENT_SUCCESS,
      description: "Send payment success email",
      actions: [
        {
          name: "Customer payment success email",
          execute: async (event) => {
            await notifyCustomer("payment_success", event.type, event.payload.entityId);
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.PAYMENT_FAILED,
      description: "Send payment failure email",
      actions: [
        {
          name: "Customer payment failed email",
          execute: async (event) => {
            await notifyCustomer("payment_failed", event.type, event.payload.entityId);
          },
          onFailure: "ignore",
        },
        {
          name: "Admin payment failed email",
          execute: async (event) => {
            await notifyAdmin("admin_payment_failed", event.type, event.payload.entityId);
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.ORDER_DISPATCHED,
      description: "Send dispatch notification",
      actions: [
        {
          name: "Customer dispatched email",
          execute: async (event) => {
            await notifyCustomer("order_dispatched", event.type, event.payload.entityId);
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.ORDER_DELIVERED,
      description: "Send delivery notification",
      actions: [
        {
          name: "Customer delivered email",
          execute: async (event) => {
            await notifyCustomer("order_delivered", event.type, event.payload.entityId);
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.ORDER_CANCELLED,
      description: "Send cancellation notification",
      actions: [
        {
          name: "Customer cancelled email",
          execute: async (event) => {
            await notifyCustomer("order_cancelled", event.type, event.payload.entityId);
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.ORDER_REFUNDED,
      description: "Send refund notification + admin alert",
      actions: [
        {
          name: "Customer refund email",
          execute: async (event) => {
            const payload = event.payload as { amount?: number };
            await notifyCustomer("refund_processed", event.type, event.payload.entityId, {
              refundAmount: payload.amount ?? 0,
            });
          },
          onFailure: "ignore",
        },
        {
          name: "Admin refund completed email",
          execute: async (event) => {
            await notifyAdmin("admin_refund_completed", event.type, event.payload.entityId);
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.INVENTORY_LOW_STOCK,
      description: "Send low stock admin alert",
      actions: [
        {
          name: "Admin low stock email",
          execute: async (event) => {
            const payload = event.payload as { entityId: string; newStock?: number };
            const { ProductService } = await import("@/lib/services/product.service");
            const product = await ProductService.getById(payload.entityId);
            await notifyAdmin("admin_low_stock", event.type, undefined, {
              productName: product?.name ?? "Unknown product",
              stock: payload.newStock ?? 0,
              productId: payload.entityId,
            });
          },
          onFailure: "ignore",
        },
      ],
    });

    registerRule({
      event: EventTypes.INVENTORY_OUT_OF_STOCK,
      description: "Send out-of-stock admin alert",
      actions: [
        {
          name: "Admin out of stock email",
          execute: async (event) => {
            const payload = event.payload as { entityId: string };
            const { ProductService } = await import("@/lib/services/product.service");
            const product = await ProductService.getById(payload.entityId);
            await notifyAdmin("admin_out_of_stock", event.type, undefined, {
              productName: product?.name ?? "Unknown product",
              productId: payload.entityId,
            });
          },
          onFailure: "ignore",
        },
      ],
    });
  },

  getRules(): AutomationRule[] {
    return rules;
  },
};
