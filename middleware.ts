// middleware.ts
export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export const config = {
  matcher: ["/orders/:path*", "/api/orders/:path*"],
};

const ALLOWED_API: Record<string, string[]> = {
  "/api/orders": ["GET", "POST"],
  "/api/orders/[^/]+$": ["GET"],
  "/api/orders/[^/]+/offers$": ["GET", "POST"],
  "/api/reviews": ["POST"],
  "/api/init-payment": ["POST"],
  "/api/messages": ["GET", "POST"],
};

function methodAllowed(path: string, method: string) {
  for (const pattern in ALLOWED_API) {
    const regex = new RegExp(`^${pattern}`);
    if (regex.test(path)) {
      return ALLOWED_API[pattern].includes(method);
    }
  }
  return true;
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // Блокировка неподдерживаемых методов API
  if (pathname.startsWith("/api/")) {
    if (!methodAllowed(pathname, req.method)) {
      return NextResponse.json(
        { error: "Method Not Allowed" },
        { status: 405 }
      );
    }
  }

  // Защита приватных страниц /orders
  if (pathname.startsWith("/orders")) {
    try {
      // Здесь process.env.JWT_SECRET уже доступен
      jwt.verify(token ?? "", process.env.JWT_SECRET!);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}
