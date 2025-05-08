// pages/api/auth/discord/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
// убрали import fetch
import { sp } from '../../../../lib/spworlds';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string;

  // 1) Обмен code → access_token
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`
  });
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  const { access_token } = await tokenRes.json();

  // 2) Получаем профиль
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  const { id: discordId, username } = await userRes.json();

  // 3) Находим карту SPWorlds по Discord ID
const userCard = await sp.findUser(discordId);

if (!userCard) {
  // Если карта не найдена — возвращаем 404 или перенаправляем на страницу ошибки
  return res.status(404).json({ error: 'Карта SPWorlds не найдена для этого Discord ID' });
}

// 4) Сохраняем/обновляем юзера
await supabaseAdmin.from('users').upsert({
  id: userCard.uuid,
  username,
  email: `${username}@spworlds`,
  role: 'user',
  created_at: new Date().toISOString()
}, { onConflict: 'id' });

  // 5) Генерим JWT и редиректим
  const token = jwt.sign(
    { id: userCard.uuid, username },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  res.redirect(`/orders#token=${token}`);
}
