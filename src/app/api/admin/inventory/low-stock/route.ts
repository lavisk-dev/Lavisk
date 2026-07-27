import { InventoryService } from "@/lib/services/inventory.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const result = await InventoryService.getLowStock();
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}