import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticated } from '../../lib/auth';
import { supabaseAdmin } from '../../lib/supabaseClient';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const userId = (req.user as any).id;
        const { orderId, rating, comment } = req.body;

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .insert([{ order_id: orderId, reviewer_id: userId, rating, comment }])
            .select()
            .single();
        if (error) return res.status(500).json({ error: 'Ошибка создания отзыва' });

        // Обновляем статус заказа в completed
        const { error: ordErr } = await supabaseAdmin
            .from('orders')
            .update({ status: 'completed' })
            .eq('id', orderId);
        if (ordErr) return res.status(500).json({ error: 'Ошибка обновления заказа' });

        return res.status(201).json({ review: data });
    }

    res.status(405).end();
}

export default authenticated(handler);
