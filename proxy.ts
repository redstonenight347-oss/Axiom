import { NextRequest, NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/auth",
];

export async function proxy(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  const isPublic =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico)$/.test(pathname);

  if (isPublic) {
    return NextResponse.next();
  }

  const session = await fetch(`${origin}/api/auth/get-session`, {
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
  }).then((res) => (res.ok ? res.json() : null));

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  return NextResponse.next();
}