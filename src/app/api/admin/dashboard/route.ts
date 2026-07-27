import { DashboardService } from "@/lib/services/dashboard.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const stats = await DashboardService.getStats();
    return ok(stats);
  } catch (error) {
    return serverError(error);
  }
}
