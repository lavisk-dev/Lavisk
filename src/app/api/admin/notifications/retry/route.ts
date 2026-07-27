import type { NextRequest } from "next/server";
import { z } from "zod";
import { NotificationEngine } from "@/lib/services/notification-engine.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const retrySchema = z.object({
  id: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const parsed = retrySchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
    const { id } = parsed.data;
    const result = await NotificationEngine.retry(id);
    if (!result) return fail("Notification not found or not retryable", 400);
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}