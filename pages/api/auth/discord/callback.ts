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
  const codeParam = req.query.code as string | undefined;
  console.log("Discord callback code:", codeParam);
  if (!codeParam) {
    console.error("No code received from Discord");
    return res.redirect(getDiscordAuthUrl());
  }
  try {
    const cookie = await handleDiscordCallback(codeParam);
    // Устанавливаем куку
    res.setHeader("Set-Cookie", [cookie]);
    // И редиректим на /orders
    return res.redirect("/orders");
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    res
      .status(500)
      .send(`<h1>Ошибка авторизации через Discord</h1><p>${err.message}</p>`);
  }
}
