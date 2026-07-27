import "server-only";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export interface ActivityEntry {
  id: string;
  event: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: "system" | "admin" | "customer";
  result: "success" | "failure" | "skipped";
  metadata?: Record<string, unknown>;
  error?: string;
  createdAt: string;
}

const memoryLog: ActivityEntry[] = [];

export const ActivityLog = {
  async log(entry: Omit<ActivityEntry, "id" | "createdAt">): Promise<void> {
    const logEntry: ActivityEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      try {
        await admin.from("activity_log").insert({
          event: logEntry.event,
          entity_type: logEntry.entityType,
          entity_id: logEntry.entityId,
          action: logEntry.action,
          actor: logEntry.actor,
          result: logEntry.result,
          metadata: logEntry.metadata ?? null,
          error: logEntry.error ?? null,
          created_at: logEntry.createdAt,
        });
      } catch {
        memoryLog.unshift(logEntry);
      }
    } else {
      memoryLog.unshift(logEntry);
    }

    if (memoryLog.length > 1000) {
      memoryLog.length = 1000;
    }
  },

  async list(limit = 50, offset = 0): Promise<ActivityEntry[]> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      try {
        const { data } = await admin
          .from("activity_log")
          .select("*")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        if (data) return data as unknown as ActivityEntry[];
      } catch {}
    }
    return memoryLog.slice(offset, offset + limit);
  },

  async listByEntity(entityType: string, entityId: string): Promise<ActivityEntry[]> {
    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      try {
        const { data } = await admin
          .from("activity_log")
          .select("*")
          .eq("entity_type", entityType)
          .eq("entity_id", entityId)
          .order("created_at", { ascending: false });
        if (data) return data as unknown as ActivityEntry[];
      } catch {}
    }
    return memoryLog.filter((e) => e.entityType === entityType && e.entityId === entityId);
  },
};
