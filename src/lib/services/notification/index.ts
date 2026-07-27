import "server-only";
import type { EmailProvider } from "./email-provider";
import { config } from "@/lib/core/config";
import { ResendProvider } from "./resend-provider";
import { MockProvider } from "./mock-provider";

export function getEmailProvider(): EmailProvider {
  return config.email.resend.isConfigured ? ResendProvider : MockProvider;
}

export { ResendProvider, MockProvider };
export type { EmailProvider, SendEmailInput, SendEmailResult } from "./email-provider";