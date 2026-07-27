import type { NextRequest } from "next/server";
import { z } from "zod";
import { NotificationEngine } from "@/lib/services/notification-engine.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const testSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const parsed = testSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid email", 422);
    const { email } = parsed.data;
    const result = await NotificationEngine.sendTestEmail(email);
    if (!result) return fail("Failed to send test email", 500);
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}