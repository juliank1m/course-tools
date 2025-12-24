import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "jkct_auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes needed for login and static assets
  const publicPaths = ["/login", "/api/login"];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/android-chrome") ||
    pathname.startsWith("/apple-touch-icon") ||
    pathname.startsWith("/logo") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".json")
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (authCookie === "1") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname || "/");
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};


