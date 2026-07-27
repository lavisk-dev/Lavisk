import "server-only";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "./email-provider";

export const MockProvider: EmailProvider = {
  name: "mock",

  isConfigured(): boolean {
    return true;
  },

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    console.log(`[MockProvider] To: ${input.to} | Subject: ${input.subject}`);
    return { success: true, providerMessageId: `mock_${Date.now()}` };
  },
};