import "server-only";
import { getEmailProvider } from "@/lib/services/notification";
import { buildEmailTemplate } from "@/lib/services/notification/templates";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type {
  NotificationRecord,
  NotificationStatus,
  NotificationEvent,
  NotificationTemplateType,
  NotificationChannel,
  NotificationRecipient,
  SendNotificationInput,
} from "@/lib/types";
import type { Order } from "@/lib/types";

// ============================================================
// In-memory store (mock fallback)
// ============================================================

const mockNotifications: NotificationRecord[] = [];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================
// Dedup tracking
// ============================================================

const sentKeys = new Set<string>();

function dedupKey(event: string, recipientEmail: string, orderId?: string): string {
  return `${event}:${recipientEmail}:${orderId ?? "global"}`;
}

// ============================================================
// Notification Engine
// ============================================================

export const NotificationEngine = {
  async send(input: SendNotificationInput): Promise<NotificationRecord | null> {
    // Dedup: skip if already sent for this event+recipient
    const dk = dedupKey(input.event, input.recipient.email, (input.metadata?.orderId as string) ?? undefined);
    if (sentKeys.has(dk)) return null;

    const provider = getEmailProvider();
    const now = new Date().toISOString();

    const record: NotificationRecord = {
      id: generateId("notif"),
      event: input.event,
      templateType: input.templateType,
      channel: input.channel,
      recipient: input.recipient,
      subject: input.subject,
      body: input.body,
      status: "queued",
      retryCount: 0,
      maxRetries: 3,
      metadata: input.metadata ?? null,
      createdAt: now,
      updatedAt: now,
    };

    // Persist
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { error } = await admin.from("notifications").insert({
        id: record.id,
        event: record.event,
        template_type: record.templateType,
        channel: record.channel,
        recipient: record.recipient,
        subject: record.subject,
        body: record.body,
        status: record.status,
        retry_count: record.retryCount,
        max_retries: record.maxRetries,
        metadata: record.metadata,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      });
      if (error) {
        console.error("[NotificationEngine] Failed to persist notification:", error.message);
        return null;
      }
    } else {
      mockNotifications.push(record);
    }

    // Send immediately
    record.status = "sending";
    record.updatedAt = new Date().toISOString();

    const result = await provider.send({
      to: input.recipient.email,
      subject: input.subject,
      html: input.body,
    });

    if (result.success) {
      record.status = "sent";
      record.sentAt = new Date().toISOString();
    } else {
      record.status = "failed";
      record.error = result.error ?? null;
    }
    record.updatedAt = new Date().toISOString();

    // Update persisted record
    if (isSupabaseAdminConfigured && admin) {
      await admin
        .from("notifications")
        .update({
          status: record.status,
          error: record.error,
          sent_at: record.sentAt,
          updated_at: record.updatedAt,
        })
        .eq("id", record.id);
    }

    if (result.success) {
      sentKeys.add(dk);
    }

    return record;
  },

  async sendTemplate(
    templateType: NotificationTemplateType,
    event: NotificationEvent,
    recipient: NotificationRecipient,
    order?: Order,
    vars?: Record<string, string | number | boolean | undefined>
  ): Promise<NotificationRecord | null> {
    const template = buildEmailTemplate(templateType, order, vars);
    if (!template) return null;

    return this.send({
      event,
      templateType,
      channel: "email",
      recipient,
      subject: template.subject,
      body: template.html,
      metadata: {
        orderId: order?.id,
        orderNumber: order?.orderNumber,
        ...vars,
      } as Record<string, unknown>,
    });
  },

  async list(filters?: {
    status?: string;
    event?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ notifications: NotificationRecord[]; total: number }> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      let query = admin.from("notifications").select("*", { count: "exact" });
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.event) query = query.eq("event", filters.event);
      const { data, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (data)
        return {
          notifications: data.map(mapRow),
          total: count ?? 0,
        };
    }

    let items = [...mockNotifications];
    if (filters?.status) items = items.filter((n) => n.status === filters.status);
    if (filters?.event) items = items.filter((n) => n.event === filters.event);
    return { notifications: items.slice(offset, offset + pageSize), total: items.length };
  },

  async getById(id: string): Promise<NotificationRecord | null> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data } = await admin.from("notifications").select("*").eq("id", id).maybeSingle();
      if (data) return mapRow(data);
    }
    return mockNotifications.find((n) => n.id === id) ?? null;
  },

  async retry(id: string): Promise<NotificationRecord | null> {
    const record = await this.getById(id);
    if (!record) return null;
    if (record.status !== "failed") return null;
    if (record.retryCount >= record.maxRetries) return null;

    record.status = "queued";
    record.retryCount += 1;
    record.updatedAt = new Date().toISOString();

    const provider = getEmailProvider();
    const result = await provider.send({
      to: record.recipient.email,
      subject: record.subject,
      html: record.body,
    });

    if (result.success) {
      record.status = "sent";
      record.sentAt = new Date().toISOString();
      record.error = null;
    } else {
      record.status = "failed";
      record.error = result.error ?? null;
    }
    record.updatedAt = new Date().toISOString();

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      await admin
        .from("notifications")
        .update({
          status: record.status,
          retry_count: record.retryCount,
          error: record.error,
          sent_at: record.sentAt,
          updated_at: record.updatedAt,
        })
        .eq("id", id);
    }

    return record;
  },

  async sendTestEmail(to: string): Promise<NotificationRecord | null> {
    return this.send({
      event: "order.created",
      templateType: "order_confirmation",
      channel: "email",
      recipient: { email: to },
      subject: `Test email from ${"Lavisk"}`,
      body: `<div style="font-family:sans-serif;padding:32px;text-align:center"><h2>Test email</h2><p>If you're reading this, the Notification Engine is working.</p></div>`,
      metadata: {},
    });
  },

  getQueueStats(): { queued: number; sending: number; sent: number; failed: number; retry: number } {
    const counts = { queued: 0, sending: 0, sent: 0, failed: 0, retry: 0 };
    for (const n of mockNotifications) {
      if (counts[n.status] !== undefined) counts[n.status]++;
    }
    return counts;
  },
};

function mapRow(row: Record<string, unknown>): NotificationRecord {
  return {
    id: row.id as string,
    event: row.event as NotificationEvent,
    templateType: row.template_type as NotificationTemplateType,
    channel: row.channel as NotificationChannel,
    recipient: row.recipient as NotificationRecipient,
    subject: row.subject as string,
    body: row.body as string,
    status: row.status as NotificationStatus,
    retryCount: Number(row.retry_count ?? 0),
    maxRetries: Number(row.max_retries ?? 3),
    error: (row.error as string) ?? null,
    metadata: row.metadata ? (row.metadata as Record<string, unknown>) : null,
    sentAt: (row.sent_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}