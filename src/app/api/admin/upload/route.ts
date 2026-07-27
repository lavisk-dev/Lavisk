import type { NextRequest } from "next/server";
import { z } from "zod";
import { uploadImage, deleteImage, isCloudinaryConfigured } from "@/lib/services/cloudinary";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const uploadSchema = z.object({
  source: z.string().min(1).refine((val) => {
    if (!val.startsWith("data:")) return true;
    const base64 = val.split(",")[1] ?? "";
    const size = Math.round(base64.length * 0.75);
    return size <= MAX_UPLOAD_BYTES;
  }, "Image exceeds 10 MB limit"),
  folder: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    if (!isCloudinaryConfigured) {
      return fail("Cloudinary is not configured. Add your Cloudinary keys to enable uploads.", 503);
    }
    const parsed = uploadSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Provide an image source", 422);

const result = await uploadImage(parsed.data.source, parsed.data.folder);
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}

const deleteSchema = z.object({
  publicId: z.string().min(1),
});

export async function DELETE(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return fail("Unauthorized", 401);
    const parsed = deleteSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Provide a publicId", 422);
    await deleteImage(parsed.data.publicId);
    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
