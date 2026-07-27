import "server-only";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/services/payment";
import { EventBus, EventTypes, type PaymentEventPayload, type EventType } from "@/lib/services/automation";
import type {
  PaymentRecord,
  PaymentStatus,
  PaymentTransaction,
  PaymentWebhook,
  RefundRecord,
} from "@/lib/types";

// ============================================================
// In-memory stores (mock fallback)
// ============================================================

const mockPayments: PaymentRecord[] = [];
const mockTransactions: PaymentTransaction[] = [];
const mockWebhooks: PaymentWebhook[] = [];
const mockRefunds: RefundRecord[] = [];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================
// Mappers
// ============================================================

function mapPaymentRow(row: Record<string, unknown>): PaymentRecord {
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    provider: row.provider as string,
    providerOrderId: (row.provider_order_id as string) ?? null,
    providerPaymentId: (row.provider_payment_id as string) ?? null,
    amount: Number(row.amount),
    currency: (row.currency as string) ?? "INR",
    status: row.status as PaymentStatus,
    method: (row.method as string) ?? null,
    rawResponse: row.raw_response ? (row.raw_response as Record<string, unknown>) : null,
    metadata: row.metadata ? (row.metadata as Record<string, unknown>) : null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================================
// Payment Engine
// ============================================================

function publishPaymentEvent(type: string, payload: PaymentEventPayload): void {
  EventBus.publish(type as EventType, payload);
}

export const PaymentEngine = {
  async createPayment(
    orderId: string,
    provider: string,
    amount: number,
    currency: string
  ): Promise<{ payment: PaymentRecord; providerOrderId: string; keyId: string }> {
    const providerService = getPaymentProvider();
    const providerOrder = await providerService.createOrder({
      amount,
      currency,
      receipt: `order_${orderId}`,
      notes: { orderId },
    });

    const payment: PaymentRecord = {
      id: generateId("pay"),
      orderId,
      provider,
      providerOrderId: providerOrder.providerOrderId,
      amount,
      currency,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { error } = await admin.from("payments").insert({
        id: payment.id,
        order_id: payment.orderId,
        provider: payment.provider,
        provider_order_id: payment.providerOrderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        created_at: payment.createdAt,
        updated_at: payment.updatedAt,
      });
      if (error) throw new Error(`Failed to create payment: ${error.message}`);
    } else {
      mockPayments.push(payment);
    }

    publishPaymentEvent(EventTypes.PAYMENT_CREATED, {
      entityType: "payment",
      entityId: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
    });

    return { payment, providerOrderId: providerOrder.providerOrderId, keyId: providerOrder.keyId };
  },

  async verifyPayment(
    orderId: string,
    providerOrderId: string,
    providerPaymentId: string,
    signature: string,
    providerName: string
  ): Promise<PaymentRecord | null> {
    const provider = getPaymentProvider();
    if (providerName !== "cod") {
      const valid = provider.verifyPayment({ providerOrderId, providerPaymentId, signature });
      if (!valid) throw new Error("Payment signature verification failed");
    }

    let payment = await this.getPaymentByOrderId(orderId);
    if (!payment) {
      throw new Error(`No payment record found for order ${orderId}. Create a payment first.`);
    }

    payment = await this.updatePaymentStatus(payment.id, "captured", {
      providerPaymentId,
      method: providerName === "cod" ? "cod" : undefined,
    });

    await this.addTransaction(payment!.id, "capture", payment!.amount, "success", providerPaymentId);

    publishPaymentEvent(EventTypes.PAYMENT_SUCCESS, {
      entityType: "payment",
      entityId: payment!.id,
      orderId: payment!.orderId,
      provider: providerName,
      amount: payment!.amount,
      status: "captured",
      providerPaymentId,
      providerOrderId,
    });

    return payment;
  },

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    extra?: { providerPaymentId?: string; method?: string }
  ): Promise<PaymentRecord | null> {
    const admin = createAdminClient();
    const now = new Date().toISOString();

    if (isSupabaseAdminConfigured && admin) {
      const updateData: Record<string, unknown> = { status, updated_at: now };
      if (extra?.providerPaymentId) updateData.provider_payment_id = extra.providerPaymentId;
      if (extra?.method) updateData.method = extra.method;
      const { data } = await admin
        .from("payments")
        .update(updateData)
        .eq("id", paymentId)
        .select()
        .single();
      if (data) return mapPaymentRow(data);
    }

    const payment = mockPayments.find((p) => p.id === paymentId);
    if (payment) {
      payment.status = status;
      payment.updatedAt = now;
      if (extra?.providerPaymentId) payment.providerPaymentId = extra.providerPaymentId;
      if (extra?.method) payment.method = extra.method;
    }
    return payment ?? null;
  },

  async addTransaction(
    paymentId: string,
    type: "capture" | "refund" | "partial_refund",
    amount: number,
    status: "success" | "failed" | "pending",
    providerReference?: string
  ): Promise<PaymentTransaction> {
    const transaction: PaymentTransaction = {
      id: generateId("pt"),
      paymentId,
      type,
      amount,
      status,
      providerReference: providerReference ?? null,
      createdAt: new Date().toISOString(),
    };

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      await admin.from("payment_transactions").insert({
        id: transaction.id,
        payment_id: transaction.paymentId,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        provider_reference: transaction.providerReference,
        created_at: transaction.createdAt,
      });
    } else {
      mockTransactions.push(transaction);
    }

    return transaction;
  },

  async getPaymentByOrderId(orderId: string): Promise<PaymentRecord | null> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data } = await admin
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) return mapPaymentRow(data);
    }
    return mockPayments.find((p) => p.orderId === orderId) ?? null;
  },

  async getPaymentById(id: string): Promise<PaymentRecord | null> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data } = await admin.from("payments").select("*").eq("id", id).maybeSingle();
      if (data) return mapPaymentRow(data);
    }
    return mockPayments.find((p) => p.id === id) ?? null;
  },

  async listPayments(filters?: {
    status?: string;
    provider?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ payments: PaymentRecord[]; total: number }> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      let query = admin.from("payments").select("*", { count: "exact" });
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.provider) query = query.eq("provider", filters.provider);
      const { data, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);
      return {
        payments: data ? data.map(mapPaymentRow) : [],
        total: count ?? 0,
      };
    }

    let items = [...mockPayments];
    if (filters?.status) items = items.filter((p) => p.status === filters.status);
    if (filters?.provider) items = items.filter((p) => p.provider === filters.provider);
    return { payments: items.slice(offset, offset + pageSize), total: items.length };
  },

  async getTransactions(paymentId: string): Promise<PaymentTransaction[]> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data } = await admin
        .from("payment_transactions")
        .select("*")
        .eq("payment_id", paymentId)
        .order("created_at", { ascending: false });
      if (data)
        return data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          paymentId: r.payment_id as string,
          type: r.type as "capture" | "refund" | "partial_refund",
          amount: Number(r.amount),
          status: r.status as "success" | "failed" | "pending",
          providerReference: (r.provider_reference as string) ?? null,
          rawResponse: r.raw_response ? (r.raw_response as Record<string, unknown>) : null,
          createdAt: r.created_at as string,
        }));
    }
    return mockTransactions.filter((t) => t.paymentId === paymentId);
  },

  async handleWebhook(
    provider: string,
    rawBody: string,
    signature: string
  ): Promise<{ received: boolean }> {
    const providerService = getPaymentProvider();
    const isValid = providerService.verifyWebhookSignature(rawBody, signature);

    const event = JSON.parse(rawBody) as {
      event: string;
      payload?: {
        payment?: {
          entity?: {
            order_id?: string;
            id?: string;
            notes?: { orderId?: string };
            status?: string;
          };
        };
      };
    };

    const webhook: PaymentWebhook = {
      id: generateId("wh"),
      provider,
      eventType: event.event,
      rawBody,
      signature,
      isValid,
      isProcessed: false,
      createdAt: new Date().toISOString(),
    };

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      await admin.from("payment_webhooks").insert({
        id: webhook.id,
        provider: webhook.provider,
        event_type: webhook.eventType,
        raw_body: webhook.rawBody,
        signature: webhook.signature,
        is_valid: webhook.isValid,
        is_processed: webhook.isProcessed,
        created_at: webhook.createdAt,
      });
    } else {
      mockWebhooks.push(webhook);
    }

    if (!isValid) {
      webhook.isProcessed = true;
      if (isSupabaseAdminConfigured && admin) {
        await admin
          .from("payment_webhooks")
          .update({ is_processed: true, error: "Invalid signature" })
          .eq("id", webhook.id);
      }
      throw new Error("Invalid webhook signature");
    }

    const notes = event.payload?.payment?.entity?.notes;
    const providerOrderId = event.payload?.payment?.entity?.order_id;
    const providerPaymentId = event.payload?.payment?.entity?.id;
    const orderId = notes?.orderId;

    if (event.event === "payment.captured" && orderId && providerOrderId && providerPaymentId) {
      await this.verifyPayment(orderId, providerOrderId, providerPaymentId, signature, provider);
    } else if (event.event === "payment.failed" && orderId) {
      publishPaymentEvent(EventTypes.PAYMENT_FAILED, {
        entityType: "payment",
        entityId: webhook.id,
        orderId,
        provider,
        status: "failed",
      });
    }

    webhook.isProcessed = true;
    if (isSupabaseAdminConfigured && admin) {
      await admin
        .from("payment_webhooks")
        .update({ is_processed: true })
        .eq("id", webhook.id);
    }

    publishPaymentEvent(EventTypes.PAYMENT_WEBHOOK_RECEIVED, {
      entityType: "payment",
      entityId: webhook.id,
      provider,
      status: event.event,
    });

    return { received: true };
  },

  async processRefund(
    paymentId: string,
    amount: number,
    reason: string
  ): Promise<RefundRecord | null> {
    const payment = await this.getPaymentById(paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.status !== "captured" && payment.status !== "partially_refunded") {
      throw new Error(`Payment ${paymentId} is not refundable. Status: ${payment.status}`);
    }

    const providerService = getPaymentProvider();
    let providerRefundId: string | null = null;

    if (providerService.createRefund && payment.providerPaymentId && payment.providerOrderId) {
      try {
        const result = await providerService.createRefund({
          paymentId,
          amount,
          reason,
          providerOrderId: payment.providerOrderId,
          providerPaymentId: payment.providerPaymentId,
        });
        providerRefundId = result.providerRefundId;
      } catch {
        // If provider refund fails, still record as pending
      }
    }

    const refund: RefundRecord = {
      id: generateId("ref"),
      paymentId,
      orderId: payment.orderId,
      amount,
      reason,
      status: providerRefundId ? "success" : "pending",
      providerRefundId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      await admin.from("refunds").insert({
        id: refund.id,
        payment_id: refund.paymentId,
        order_id: refund.orderId,
        amount: refund.amount,
        reason: refund.reason,
        status: refund.status,
        provider_refund_id: refund.providerRefundId,
        created_at: refund.createdAt,
        updated_at: refund.updatedAt,
      });
    } else {
      mockRefunds.push(refund);
    }

    await this.addTransaction(paymentId, amount === payment.amount ? "refund" : "partial_refund", amount, refund.status, providerRefundId ?? undefined);

    const newStatus: PaymentStatus = amount === payment.amount ? "refunded" : "partially_refunded";
    await this.updatePaymentStatus(paymentId, newStatus);

    publishPaymentEvent(EventTypes.PAYMENT_REFUNDED, {
      entityType: "payment",
      entityId: paymentId,
      orderId: payment.orderId,
      amount,
      status: newStatus,
    });

    return refund;
  },

  async getRefunds(paymentId: string): Promise<RefundRecord[]> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data } = await admin
        .from("refunds")
        .select("*")
        .eq("payment_id", paymentId)
        .order("created_at", { ascending: false });
      if (data)
        return data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          paymentId: r.payment_id as string,
          orderId: r.order_id as string,
          amount: Number(r.amount),
          reason: r.reason as string,
          status: r.status as "pending" | "success" | "failed",
          providerRefundId: (r.provider_refund_id as string) ?? null,
          rawResponse: r.raw_response ? (r.raw_response as Record<string, unknown>) : null,
          createdAt: r.created_at as string,
          updatedAt: r.updated_at as string,
        }));
    }
    return mockRefunds.filter((r) => r.paymentId === paymentId);
  },

  async getPaymentDetail(paymentId: string): Promise<{
    payment: PaymentRecord | null;
    transactions: PaymentTransaction[];
    refunds: RefundRecord[];
  }> {
    const payment = await this.getPaymentById(paymentId);
    if (!payment) return { payment: null, transactions: [], refunds: [] };
    const transactions = await this.getTransactions(paymentId);
    const refunds = await this.getRefunds(paymentId);
    return { payment, transactions, refunds };
  },
};