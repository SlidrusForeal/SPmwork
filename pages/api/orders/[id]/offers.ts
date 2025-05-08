import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticated } from '../../../../lib/auth';
import { supabase } from '../../../../lib/supabaseClient';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const orderId = req.query.id as string;
    const userId = (req.user as any).id;

    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('offers')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });
        if (error) return res.status(500).json({ error: 'Ошибка получения офферов' });
        return res.status(200).json({ offers: data });
    }

    if (req.method === 'POST') {
        const { price, delivery_time, message } = req.body;
        const { data, error } = await supabase
            .from('offers')
            .insert([{ order_id: orderId, seller_id: userId, price, delivery_time, message }])
            .select()
            .single();
        if (error) return res.status(500).json({ error: 'Ошибка создания оффера' });
        return res.status(201).json({ offer: data });
    }

    res.status(405).end();
}

export default authenticated(handler);
