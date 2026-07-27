import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { CustomerService } from "@/lib/services/customer.service";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const customers = await CustomerService.list();
    return ok(customers);
  } catch (error) {
    return serverError(error);
  }
}
