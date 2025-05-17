// middleware.ts
import { NextResponse, NextRequest } from "next/server";

export const config = {
  matcher: [
    "/api/orders/:path*",
    "/api/reviews",
    "/api/messages",
    "/api/init-payment",
    "/api/admin/:path*",
    "/api/profile/:path*",
    "/api/auth/:path*",
    "/api/webhook",
  ],
};

// Паттерны без якорей, они будут добавлены при создании RegExp
const ALLOWED_API: Record<string, string[]> = {
  "/api/orders": ["GET", "POST"],
  "/api/orders/[^/]+": ["GET"],
  "/api/orders/[^/]+/offers": ["GET", "POST"],
  "/api/reviews": ["GET", "POST"],
  "/api/init-payment": ["POST"],
  "/api/messages": ["GET", "POST"],
  "/api/admin/orders": ["GET", "PATCH"],
  "/api/admin/users": ["GET", "PATCH"],
  "/api/profile/minecraft": ["POST"],
  "/api/profile/stats": ["GET"],
  "/api/auth/me": ["GET"],
  "/api/auth/discord/login": ["GET"],
  "/api/auth/discord/callback": ["GET"],
  "/api/auth/discord/url": ["GET"],
  "/api/webhook": ["POST"],
};

function methodAllowed(path: string, method: string): boolean {
  // Проверяем каждый паттерн
  for (const pattern in ALLOWED_API) {
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(path)) {
      return ALLOWED_API[pattern].includes(method);
    }
  }
  // По умолчанию блокируем неописанные пути
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    // 1) Блокируем неподдерживаемые методы
    if (!methodAllowed(pathname, req.method)) {
      return NextResponse.json(
        {
          error: "Method Not Allowed",
          allowedMethods: getAllowedMethods(pathname),
        },
        {
          status: 405,
          headers: {
            Allow: getAllowedMethods(pathname).join(", "),
          },
        }
      );
    }
    // 2) Пропускаем проверку JWT в middleware —
    //    аутентификация теперь в API-хендлерах
    return NextResponse.next();
  }

  // Для всех прочих (страницы, статика) — пропускаем
  return NextResponse.next();
}

// Вспомогательная функция для получения разрешенных методов
function getAllowedMethods(path: string): string[] {
  for (const pattern in ALLOWED_API) {
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(path)) {
      return ALLOWED_API[pattern];
    }
  }
  return [];
}
