// lib/auth.ts
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Генерирует JWT с полезной нагрузкой и сроком действия 7 дней
 */
export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Проверяет валидность JWT и возвращает payload
 */
export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Оборачивает API-хендлер, проверяя наличие и корректность JWT
 */
export function authenticated(handler: any) {
  return async (req: NextApiRequest & { user?: any }, res: NextApiResponse) => {
    // Пытаемся извлечь токен из заголовка Authorization или из cookie
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      const cookies = parse(req.headers.cookie || "");
      token = cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: "Нет токена" });
    }

    try {
      // Верификация JWT и передача payload в req.user
      req.user = verifyToken(token) as any;
      return await handler(req, res);
    } catch {
      return res.status(401).json({ error: "Неверный токен" });
    }
  };
}

/**
 * Проверяет наличие роли в списке allowedRoles
 */
export function requireRole(allowedRoles: string[]) {
  return (handler: any) =>
    async (req: NextApiRequest & { user?: any }, res: NextApiResponse) => {
      const userRole = req.user?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: "Нет доступа" });
      }
      return handler(req, res);
    };
}
