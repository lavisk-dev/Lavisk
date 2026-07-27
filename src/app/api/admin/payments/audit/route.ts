import type { NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = Number(req.nextUrl.searchParams.get("pageSize") ?? "50");
    const offset = (page - 1) * pageSize;

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      const { data, count } = await admin
        .from("activity_logs")
        .select("*", { count: "exact" })
        .eq("entity_type", "payment")
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);
      return ok({ logs: data ?? [], total: count ?? 0 });
    }

    return ok({ logs: [], total: 0 });
  } catch (error) {
    return serverError(error);
  }
}