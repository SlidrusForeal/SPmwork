// middleware.ts
import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export const config = {
  matcher: [
    "/api/orders/:path*",
    "/api/reviews",
    "/api/messages",
    "/api/init-payment",
  ],
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

  if (pathname.startsWith("/api/")) {
    // 1) Блокируем неподдерживаемые методы
    if (!methodAllowed(pathname, req.method)) {
      return NextResponse.json(
        { error: "Method Not Allowed" },
        { status: 405 }
      );
    }
    // 2) Проверяем JWT
    try {
      if (!token) throw new Error("Нет токена");
      jwt.verify(token, process.env.JWT_SECRET!);
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Для всех прочих (страницы, статика) — пропускаем
  return NextResponse.next();
}
