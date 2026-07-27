import type { NextRequest } from "next/server";
import { InventoryService } from "@/lib/services/inventory.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { removeStockSchema } from "@/lib/utils/validation";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const parsed = removeStockSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }
    const { productId, quantity, reason, reference, notes } = parsed.data;
    const movement = await InventoryService.removeStock(productId, quantity, reason, "admin", {
      reference,
      notes,
    });
    return ok(movement, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}