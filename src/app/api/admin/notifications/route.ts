import type { NextRequest } from "next/server";
import { NotificationEngine } from "@/lib/services/notification-engine.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    const event = req.nextUrl.searchParams.get("event") ?? undefined;
    const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = Number(req.nextUrl.searchParams.get("pageSize") ?? "50");
    const result = await NotificationEngine.list({ status, event, page, pageSize });
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}