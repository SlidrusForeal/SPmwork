// pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticated } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabaseClient';

async function me(req: NextApiRequest & { user: any }, res: NextApiResponse) {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, username, role, created_at')
        .eq('id', userId)
        .single();
    if (error) return res.status(500).json({ error: 'Ошибка получения профиля' });
    res.status(200).json({ user: data });
}

export default authenticated(me);
