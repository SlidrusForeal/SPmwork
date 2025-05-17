// lib/auth.ts
import { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

export interface JWTPayload {
  id: string;
  role: string;
  username: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Генерирует JWT с полезной нагрузкой и сроком действия 7 дней
 */
export function signToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Проверяет валидность JWT и возвращает payload
 */
export function verifyToken(token: string): JWTPayload {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
}

/**
 * Оборачивает API-хендлер, проверяя наличие и корректность JWT
 */
export function authenticated(
  handler: (
    req: NextApiRequest & { user: JWTPayload },
    res: NextApiResponse
  ) => Promise<void | NextApiResponse>
) {
  return async (
    req: NextApiRequest & { user?: JWTPayload },
    res: NextApiResponse
  ): Promise<void> => {
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
      res.status(401).json({ error: "Нет токена" });
      return;
    }

    try {
      // Верификация JWT и передача payload в req.user
      req.user = verifyToken(token);
      await handler(req as NextApiRequest & { user: JWTPayload }, res);
      return;
    } catch (error) {
      console.error("JWT verification error:", error);
      res.status(401).json({ error: "Неверный токен" });
      return;
    }
  };
}

/**
 * Проверяет наличие роли в списке allowedRoles
 */
export function requireRole(allowedRoles: string[]) {
  return (
    handler: (
      req: NextApiRequest & { user: JWTPayload },
      res: NextApiResponse
    ) => Promise<void | NextApiResponse>
  ) => {
    return authenticated(async (req, res) => {
      const userRole = req.user?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        res.status(403).json({ error: "Нет доступа" });
        return;
      }
      await handler(req, res);
      return;
    });
  };
}
