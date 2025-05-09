// middleware.ts
import { NextResponse, NextRequest } from "next/server";

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
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    // 1) Блокируем неподдерживаемые методы
    if (!methodAllowed(pathname, req.method)) {
      return NextResponse.json(
        { error: "Method Not Allowed" },
        { status: 405 }
      );
    }
    // 2) Пропускаем проверку JWT в middleware —
    //    аутентификация теперь в API-хендлерах
    return NextResponse.next();
  }

  // Для всех прочих (страницы, статика) — пропускаем
  return NextResponse.next();
}
