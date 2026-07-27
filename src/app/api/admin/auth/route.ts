import type { NextRequest } from "next/server";
import { z } from "zod";
import { verifyCredentials, setAdminSession, clearAdminSession } from "@/lib/auth/admin-auth";
import { ok, fail, serverError } from "@/lib/utils/api";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get("action");

    if (action === "logout") {
      await clearAdminSession();
      return ok({ loggedOut: true });
    }

    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Enter a username and password", 422);

    const { username, password } = parsed.data;
    if (!verifyCredentials(username, password)) {
      return fail("Incorrect username or password", 401);
    }

    await setAdminSession(username);
    return ok({ authenticated: true });
  } catch (error) {
    return serverError(error);
  }
}
