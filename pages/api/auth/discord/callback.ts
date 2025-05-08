// pages/api/auth/discord/callback.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { handleDiscordCallback } from "../../../../lib/authProviders";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code } = req.query;
  // Если code нет или массив — начинаем заново
  if (!code || Array.isArray(code)) {
    return res.redirect("/api/auth/discord/login");
  }

  try {
    // Получаем готовую Set-Cookie строку
    const cookie = await handleDiscordCallback(code);
    res.setHeader("Set-Cookie", cookie);
    // После установки cookie — редирект в защищённую зону
    return res.redirect("/orders");
  } catch (err: any) {
    console.error("Discord OAuth error:", err);
    return res
      .status(500)
      .send("Ошибка авторизации через Discord. Попробуйте ещё раз.");
  }
}
