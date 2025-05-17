// pages/api/auth/discord/callback.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getDiscordAuthUrl,
  handleDiscordCallback,
} from "../../../../lib/authProviders";
import { authLimiter } from "../../../../lib/rateLimit";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const codeParam = req.query.code as string | undefined;
  const stateParam = req.query.state as string | undefined;

  console.log("Discord callback code:", codeParam);

  if (!codeParam) {
    console.error("No code received from Discord");
    res.redirect(getDiscordAuthUrl());
    return;
  }

  try {
    const cookie = await handleDiscordCallback(codeParam);
    res.setHeader("Set-Cookie", [cookie]);

    // Parse the state parameter to get the return URL
    let returnTo = "/orders";
    if (stateParam) {
      try {
        const state = JSON.parse(Buffer.from(stateParam, "base64").toString());
        if (state.returnTo) {
          returnTo = state.returnTo;
        }
      } catch (e) {
        console.error("Failed to parse state parameter:", e);
      }
    }

    res.redirect(returnTo);
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
