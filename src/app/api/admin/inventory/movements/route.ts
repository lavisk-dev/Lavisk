import type { NextRequest } from "next/server";
import { InventoryService } from "@/lib/services/inventory.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const sp = req.nextUrl.searchParams;
    const result = await InventoryService.getMovements({
      productId: sp.get("productId") ?? undefined,
      operation: sp.get("operation") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}