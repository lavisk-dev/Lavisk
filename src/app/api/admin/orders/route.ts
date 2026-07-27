import type { NextRequest } from "next/server";
import { OrderService } from "@/lib/services/order.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import type { OrderStatus } from "@/lib/types";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const status = req.nextUrl.searchParams.get("status") as OrderStatus | null;
    const result = await OrderService.list({ status: status ?? undefined, pageSize: 100 });
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}
