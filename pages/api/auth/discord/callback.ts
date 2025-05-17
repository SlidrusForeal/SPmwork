// pages/api/auth/discord/callback.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getDiscordAuthUrl,
  handleDiscordCallback,
} from "../../../../lib/authProviders";
import { authLimiter } from "../../../../lib/rateLimit";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const codeParam = req.query.code as string | undefined;
  console.log("Discord callback code:", codeParam);
  if (!codeParam) {
    console.error("No code received from Discord");
    res.redirect(getDiscordAuthUrl());
    return;
  }
  try {
    const cookie = await handleDiscordCallback(codeParam);
    // Устанавливаем куку
    res.setHeader("Set-Cookie", [cookie]);
    // И редиректим на /orders
    res.redirect("/orders");
    return;
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    res
      .status(500)
      .send(`<h1>Ошибка авторизации через Discord</h1><p>${err.message}</p>`);
    return;
  }
}

// Apply rate limiter to the handler
export default function callbackWithRateLimit(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return authLimiter(req, res, handler);
}
