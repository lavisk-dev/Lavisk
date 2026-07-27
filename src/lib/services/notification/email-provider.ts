import "server-only";
import type { Order } from "@/lib/types";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface EmailProvider {
  name: string;
  send(input: SendEmailInput): Promise<SendEmailResult>;
  isConfigured(): boolean;
}

export type EmailTemplateVars = Record<string, string | number | boolean | undefined>;

export interface BuildEmailInput {
  templateType: string;
  order?: Order;
  vars?: EmailTemplateVars;
}