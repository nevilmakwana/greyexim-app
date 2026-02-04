import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 1. Check if user is trying to access "/admin"
  if (request.nextUrl.pathname.startsWith("/admin")) {
    
    // EXCEPTION: Allow access to the login page itself!
    if (request.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }

    // 2. Check if they have the "admin_token" cookie
    const token = request.cookies.get("admin_token");

    // 3. If no token, kick them to the login page
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

// Only run this guard on /admin routes
export const config = {
  matcher: "/admin/:path*",
};