// pages/api/auth/discord/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getDiscordAuthUrl } from "../../../../lib/authProviders";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const returnTo = (req.query.returnTo as string) || "/orders";
  const state = Buffer.from(JSON.stringify({ returnTo })).toString("base64");
  res.redirect(getDiscordAuthUrl(state));
}
