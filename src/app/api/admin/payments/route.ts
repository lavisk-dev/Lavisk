import type { NextRequest } from "next/server";
import { PaymentEngine } from "@/lib/services/payment-engine.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    const provider = req.nextUrl.searchParams.get("provider") ?? undefined;
    const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = Number(req.nextUrl.searchParams.get("pageSize") ?? "50");
    const result = await PaymentEngine.listPayments({ status, provider, page, pageSize });
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}