import type { NextRequest } from "next/server";
import { ContactService } from "@/lib/services/contact.service";
import { sendContactAcknowledgement } from "@/lib/services/email/resend";
import { contactSchema } from "@/lib/utils/validation";
import { ok, fail, serverError } from "@/lib/utils/api";

export async function POST(req: NextRequest) {
  try {
    const parsed = contactSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid submission", 422);
    }

    const submission = await ContactService.create(parsed.data);

    // Fire-and-forget acknowledgement; never block the response on email.
    sendContactAcknowledgement(parsed.data.email, parsed.data.name).catch(() => {});

    return ok({ id: submission.id });
  } catch (error) {
    return serverError(error);
  }
}
