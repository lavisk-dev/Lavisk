import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { mockOrders } from "@/lib/data/mock-data";
import type { Order, OrderStatus } from "@/lib/types";
import { generateOrderNumber } from "@/lib/utils";
import { EventBus, EventTypes } from "@/lib/services/automation";

// In-memory store used only when Supabase isn't configured, so the
// checkout flow is fully demoable without any external services.
// This resets on server restart — wire up Supabase for persistence.
const memoryOrders: Order[] = [...mockOrders];

export const OrderService = {
  async list(filters: { status?: OrderStatus; page?: number; pageSize?: number } = {}) {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        let query = supabase.from("orders").select("*", { count: "exact" });
        if (filters.status) query = query.eq("status", filters.status);
        const page = filters.page ?? 1;
        const pageSize = filters.pageSize ?? 20;
        const from = (page - 1) * pageSize;
        query = query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
        const { data, count } = await query;
        if (data) return { orders: data as unknown as Order[], total: count ?? data.length };
      }
    }
    let items = [...memoryOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (filters.status) items = items.filter((o) => o.status === filters.status);
    return { orders: items, total: items.length };
  },

  async getById(id: string): Promise<Order | null> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
        if (data) return data as unknown as Order;
      }
    }
    return memoryOrders.find((o) => o.id === id) ?? null;
  },

  async getByOrderNumber(orderNumber: string): Promise<Order | null> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("order_number", orderNumber)
          .maybeSingle();
        if (data) return data as unknown as Order;
      }
    }
    return memoryOrders.find((o) => o.orderNumber === orderNumber) ?? null;
  },

  async create(input: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">): Promise<Order> {
    const now = new Date().toISOString();
    const order: Order = {
      ...input,
      id: `o_${Date.now()}`,
      orderNumber: generateOrderNumber(),
      createdAt: now,
      updatedAt: now,
    };

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin.from("orders").insert(order).select().single();
      if (!error && data) return data as unknown as Order;
    }

    memoryOrders.unshift(order);
    EventBus.publish(EventTypes.ORDER_CREATED, {
      entityType: "order",
      entityId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerEmail: order.customerEmail,
      total: order.total,
    });
    return order;
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as unknown as Order;
    }
    const order = memoryOrders.find((o) => o.id === id);
    if (order) {
      const previousStatus = order.status;
      order.status = status;
      order.updatedAt = new Date().toISOString();
      EventBus.publish(EventTypes.ORDER_STATUS_CHANGED, {
        entityType: "order",
        entityId: id,
        orderNumber: order.orderNumber,
        status,
        previousStatus,
        customerEmail: order.customerEmail,
        items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
    }
    return order ?? null;
  },

  async attachPayment(id: string, paymentOrderId: string, paymentId: string): Promise<Order | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    if (existing.status === "paid") return existing;

    // Stock decrement is handled by the automation rule on ORDER_PAID.
    // No direct ProductService call needed here.

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin
        .from("orders")
        .update({ payment_order_id: paymentOrderId, payment_id: paymentId, status: "paid" })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as unknown as Order;
    }
    const order = memoryOrders.find((o) => o.id === id);
    if (order) {
      order.paymentOrderId = paymentOrderId;
      order.paymentId = paymentId;
      order.status = "paid";
      EventBus.publish(EventTypes.ORDER_PAID, {
        entityType: "order",
        entityId: id,
        orderNumber: order.orderNumber,
        status: "paid",
        customerEmail: order.customerEmail,
        total: order.total,
        items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
    }
    return order ?? null;
  },
};
