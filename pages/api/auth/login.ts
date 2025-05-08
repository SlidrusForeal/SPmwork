// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { SPWorlds } from 'spworlds';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { cardId, cardToken } = req.body as { cardId: string; cardToken: string };
  const sp = new SPWorlds({ id: cardId, token: cardToken });

  try {
    const account = await sp.getCardOwner();
    await supabaseAdmin
      .from('users')
      .upsert({ /* … */ }, { onConflict: 'id' });
    const token = jwt.sign({ id: account.id, username: account.username }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    return res.status(200).json({ token, user: { id: account.id, username: account.username } });
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: 'Ошибка аутентификации' });
  }
}
