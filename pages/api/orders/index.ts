import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticated } from '../../../lib/auth';
import { supabase } from '../../../lib/supabaseClient';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const userId = (req.user as any).id;

    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .or(`status.eq.open,buyer_id.eq.${userId}`)
            .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: 'Ошибка получения заказов' });
        return res.status(200).json({ orders: data });
    }

    if (req.method === 'POST') {
        const { title, description, category, budget } = req.body;
        const { data, error } = await supabase
            .from('orders')
            .insert([{ buyer_id: userId, title, description, category, budget }])
            .select()
            .single();
        if (error) return res.status(500).json({ error: 'Ошибка создания заказа' });
        return res.status(201).json({ order: data });
    }

    res.status(405).end();
}

export default authenticated(handler);
