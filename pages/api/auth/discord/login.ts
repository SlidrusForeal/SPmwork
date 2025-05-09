// pages/api/auth/discord/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getDiscordAuthUrl } from "../../../../lib/authProviders";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.redirect(getDiscordAuthUrl());
}
