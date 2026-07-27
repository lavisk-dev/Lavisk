import type { NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    return fail("Not found", 404);
  } catch (error) {
    return serverError(error);
  }
}