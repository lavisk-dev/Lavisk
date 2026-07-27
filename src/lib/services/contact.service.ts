import "server-only";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { ContactSubmission } from "@/lib/types";
import { EventBus, EventTypes } from "@/lib/services/automation";

const memorySubmissions: ContactSubmission[] = [];

export const ContactService = {
  async create(
    input: Omit<ContactSubmission, "id" | "createdAt">
  ): Promise<ContactSubmission> {
    const submission: ContactSubmission = {
      ...input,
      id: `contact_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin.from("contacts").insert(submission).select().single();
      if (!error && data) return data as unknown as ContactSubmission;
    }

    memorySubmissions.unshift(submission);
    EventBus.publish(EventTypes.CONTACT_SUBMITTED, {
      entityType: "contact",
      entityId: submission.id,
      email: submission.email,
      name: submission.name,
    });
    return submission;
  },

  async list(): Promise<ContactSubmission[]> {
    return memorySubmissions;
  },
};
