import "server-only";
import { Resend } from "resend";
import { config } from "@/lib/core/config";
import { BRAND_NAME } from "@/lib/constants";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "./email-provider";

const apiKey = config.email.resend.apiKey;
const defaultFrom = config.email.resend.fromEmail ?? `${BRAND_NAME} <noreply@lavisk.com>`;

function getClient(): Resend | null {
  if (!config.email.resend.isConfigured) return null;
  return new Resend(apiKey!);
}

export const ResendProvider: EmailProvider = {
  name: "resend",

  isConfigured(): boolean {
    return config.email.resend.isConfigured;
  },

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const client = getClient();
    if (!client) {
      return { success: false, error: "Resend not configured" };
    }

    try {
      const { data, error } = await client.emails.send({
        from: input.from ?? defaultFrom,
        to: input.to,
        subject: input.subject,
        html: input.html,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, providerMessageId: data?.id };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
};