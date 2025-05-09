// pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // затираем cookie
  res.setHeader(
    "Set-Cookie",
    serialize("token", "", {
      path: "/",
      httpOnly: true,
      maxAge: -1,
    })
  );
  // редирект на главную
  res.writeHead(302, { Location: "/" });
  res.end();
}
