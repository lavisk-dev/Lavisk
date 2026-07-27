import type { NextRequest } from "next/server";
import { ActivityLog } from "@/lib/services/automation";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);

    const sp = req.nextUrl.searchParams;
    const limit = sp.has("limit") ? Number(sp.get("limit")) : 50;
    const offset = sp.has("offset") ? Number(sp.get("offset")) : 0;
    const entityType = sp.get("entityType");
    const entityId = sp.get("entityId");

    if (entityType && entityId) {
      const entries = await ActivityLog.listByEntity(entityType, entityId);
      return ok(entries);
    }

    const entries = await ActivityLog.list(limit, offset);
    return ok(entries);
  } catch (error) {
    return serverError(error);
  }
}
