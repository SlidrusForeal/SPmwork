// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";
export const config = {
  matcher: ["/orders/:path*"],
};
export function middleware(req: NextRequest) {
  const { cookies, nextUrl } = req;
  const token = cookies.get("token")?.value;
  const protectedRoutes = ["/orders", "/orders/"];

  if (protectedRoutes.some((p) => nextUrl.pathname.startsWith(p))) {
    try {
      jwt.verify(token ?? "", process.env.JWT_SECRET!);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
}
