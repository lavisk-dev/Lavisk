import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/auth/admin-auth";

/**
 * Gate the admin panel. Unauthenticated requests to /admin (except the
 * login page and the auth API) are redirected to /admin/login.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const isAdminArea = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";
  const isAuthApi = pathname.startsWith("/api/admin/auth");

  if (!isAdminArea || isLoginPage || isAuthApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (await isValidSessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", req.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
