import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/session";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get("session")?.value;

  const isDashboard = pathname.startsWith("/dashboard");
  const isLogin = pathname === "/login";

  if (isDashboard) {
    if (!sessionCookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    const session = await decrypt(sessionCookie);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isLogin && sessionCookie) {
    const session = await decrypt(sessionCookie);
    if (session) {
      const url = req.nextUrl.clone();
      url.pathname = `/dashboard/${session.role}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}
