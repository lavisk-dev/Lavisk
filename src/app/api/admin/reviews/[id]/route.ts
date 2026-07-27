import type { NextRequest } from "next/server";
import { z } from "zod";
import { ReviewService } from "@/lib/services/review.service";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const schema = z.object({ isApproved: z.boolean() });

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const { id } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid request", 422);
    await ReviewService.setApproval(id, parsed.data.isApproved);
    return ok({ updated: true });
  } catch (error) {
    return serverError(error);
  }
}
