// pages/api/auth/discord/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { sp } from '../../../lib/spworlds';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string;
  // 1) Обмен code → access_token
  const data = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`
  });
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: data
  });
  const { access_token } = await tokenRes.json();

  // 2) Получаем профиль пользователя
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  const { id: discordId, username } = await userRes.json();

  // 3) Через SPWorlds SDK находим карту по Discord‑ID
  const userCard = await sp.findUser(discordId); // → { username, uuid } :contentReference[oaicite:1]{index=1}

  // 4) Upsert пользователя в Supabase
  await supabaseAdmin
    .from('users')
    .upsert({
      id: userCard.uuid,
      username,
      email: `${username}@spworlds`,
      role: 'user',
      created_at: new Date().toISOString()
    }, { onConflict: 'id' });

  // 5) Генерируем наш JWT и устанавливаем его
  const token = jwt.sign({ id: userCard.uuid, username }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  // Можно сразу редиректить, передав токен в URL‑хэш
  res.redirect(`/orders#token=${token}`);
}
