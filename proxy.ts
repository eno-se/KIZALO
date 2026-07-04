import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const SETUP_EXEMPT = ["/setup", "/login", "/me", "/api", "/admin"];
const SUSPENDED_EXEMPT = ["/suspended", "/settings", "/api", "/admin"];

export default auth((req) => {
  const session = req.auth;
  if (!session?.user) return NextResponse.next();

  const { pathname } = req.nextUrl;

  if (session.user.isSuspended) {
    const exempt = SUSPENDED_EXEMPT.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!exempt) return NextResponse.redirect(new URL("/suspended", req.url));
    return NextResponse.next();
  }

  if (!session.user.displayName) {
    const exempt = SETUP_EXEMPT.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!exempt) return NextResponse.redirect(new URL("/setup", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.ico$).*)"],
};
