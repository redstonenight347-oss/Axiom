import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/api/auth") ||
    pathname === "/auth" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (isPublic) {
    return NextResponse.next();
  }

  const session = await fetch(`${req.nextUrl.origin}/api/auth/get-session`, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  }).then((res) => (res.ok ? res.json() : null));

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
