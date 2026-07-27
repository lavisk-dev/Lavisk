import type { NextRequest } from "next/server";
import { NotificationEngine } from "@/lib/services/notification-engine.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const { id } = await params;
    const notification = await NotificationEngine.getById(id);
    if (!notification) return fail("Notification not found", 404);
    return ok(notification);
  } catch (error) {
    return serverError(error);
  }
}