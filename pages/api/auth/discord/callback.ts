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

  if (!code) {
    return res.redirect(getDiscordAuthUrl());
  }

  try {
    const cookie = await handleDiscordCallback(code);
    res.setHeader("Set-Cookie", cookie);
    return res.redirect("/orders");
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    res
      .status(500)
      .send(
        `<h1>Ошибка авторизации через Discord</h1><p>${
          err.message
        }</p><p><a href="${getDiscordAuthUrl()}">Попробовать снова</a></p>`
      );
  }
}
