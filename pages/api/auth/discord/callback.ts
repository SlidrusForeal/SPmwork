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
  const codeParam = req.query.code;
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

  // Если по каким‑то причинам code не пришёл — отправляем заново на логин
  if (!code) {
    console.warn("[Discord Callback] code отсутствует, перенаправляю на OAuth");
    return res.redirect(getDiscordAuthUrl());
  }

  console.log("[Discord Callback] получен code:", code);

  try {
    const cookie = await handleDiscordCallback(code);
    // Ставим куку и редиректим в приложение
    res.setHeader("Set-Cookie", cookie);
    return res.redirect("/orders");
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    // Возвращаем понятную страницу с ошибкой, чтобы не парсить HTML как JSON
    res.status(500).send(`
      <h1>Ошибка авторизации через Discord</h1>
      <p>${err.message}</p>
      <p><a href="${getDiscordAuthUrl()}">Попробовать снова</a></p>
    `);
  }
}
