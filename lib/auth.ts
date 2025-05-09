// lib/auth.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

export function authenticated(handler: any) {
  return async (req: any, res: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Нет токена" });
    }
    const token = authHeader.split(" ")[1];
    try {
      req.user = verifyToken(token);
      return await handler(req, res);
    } catch {
      return res.status(401).json({ error: "Неверный токен" });
    }
  };
}
