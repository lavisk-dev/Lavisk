import type { NextRequest } from "next/server";
import { InventoryService } from "@/lib/services/inventory.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const { productId } = await params;
    const result = await InventoryService.getProductInventory(productId);
    if (!result.product) return fail("Product not found", 404);
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}