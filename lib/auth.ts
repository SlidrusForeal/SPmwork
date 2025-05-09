// lib/auth.ts
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";

const JWT_SECRET = process.env.JWT_SECRET!;

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

export function authenticated(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // 1) Пытаемся взять из заголовка
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      // 2) Фолбэк на cookie
      const cookies = parse(req.headers.cookie || "");
      token = cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: "Нет токена" });
    }

    try {
      // проверяем JWT
      req.user = verifyToken(token) as any;
      return await handler(req, res);
    } catch {
      return res.status(401).json({ error: "Неверный токен" });
    }
  };
}
