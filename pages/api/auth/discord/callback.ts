// pages/api/auth/discord/callback.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getDiscordAuthUrl,
  handleDiscordCallback,
} from "../../../../lib/authProviders";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const code = Array.isArray(req.query.code)
    ? req.query.code[0]
    : req.query.code;
  if (!code) {
    // если нет кода, отправляем на начало OAuth
    return res.redirect(getDiscordAuthUrl());
  }

  try {
    const cookie = await handleDiscordCallback(code);
    res.setHeader("Set-Cookie", cookie);
    return res.redirect("/orders");
  } catch (err: any) {
    console.error("Full OAuth error:", err);
    return res
      .status(500)
      .send(`Ошибка авторизации через Discord: ${err.message}`);
  }
}
