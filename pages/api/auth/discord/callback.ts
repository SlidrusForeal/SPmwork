// pages/api/auth/discord/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDiscordAuthUrl, handleDiscordCallback } from '../../../../lib/authProviders';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  if (!code || Array.isArray(code)) {
    // если нет code — отправить на начало OAuth
    return res.redirect(getDiscordAuthUrl());
  }

  try {
    const cookie = await handleDiscordCallback(code);
    res.setHeader('Set-Cookie', cookie);
    return res.redirect('/orders');
  } catch (e: any) {
    console.error('Discord OAuth error:', e);
    return res
      .status(500)
      .send('Ошибка авторизации через Discord. Попробуйте ещё раз.');
  }
}
