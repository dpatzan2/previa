import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isPublicPath,
  loginRedirectUrl,
  SESSION_COOKIE_NAME,
} from "@/lib/session-cookie";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!hasSessionCookie) {
    const loginUrl = new URL(loginRedirectUrl(pathname, "missing"), request.url);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
