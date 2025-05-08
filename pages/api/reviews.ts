// pages/api/reviews.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticated } from '../../lib/auth';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

async function handler(req: NextApiRequest & { user: any }, res: NextApiResponse) {
    if (req.method === 'POST') {
        const userId = req.user.id;
        const { orderId, rating, comment } = req.body;
        const { data, error } = await supabaseAdmin
            .from('reviews')
            .insert([{ order_id: orderId, reviewer_id: userId, rating, comment }])
            .select()
            .single();
        if (error) return res.status(500).json({ error: 'Ошибка создания отзыва' });

        await supabaseAdmin.from('orders').update({ status: 'completed' }).eq('id', orderId);
        return res.status(201).json({ review: data });
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default authenticated(handler);
