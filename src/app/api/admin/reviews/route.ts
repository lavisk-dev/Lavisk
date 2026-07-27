import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ReviewService } from "@/lib/services/review.service";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const reviews = await ReviewService.listAll();
    return ok(reviews);
  } catch (error) {
    return serverError(error);
  }
}
