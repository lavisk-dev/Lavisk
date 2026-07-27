import type { NextRequest } from "next/server";
import { z } from "zod";
import { CartService } from "@/lib/services/cart.service";
import { cartLineSchema } from "@/lib/utils/validation";
import { ok, fail, serverError } from "@/lib/utils/api";

const bodySchema = z.object({ items: z.array(cartLineSchema) });

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid cart", 422);
    }
    const priced = await CartService.price(parsed.data.items);
    return ok(priced);
  } catch (error) {
    return serverError(error);
  }
}
