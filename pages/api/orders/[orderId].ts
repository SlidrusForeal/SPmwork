// pages/api/orders/[orderId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticated } from '../../../lib/auth';
import { supabase } from '../../../lib/supabaseClient';

async function handler(req: NextApiRequest & { user: any }, res: NextApiResponse) {
    const orderId = req.query.orderId as string;

    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
        if (error) return res.status(500).json({ error: 'Ошибка получения заказа' });
        return res.status(200).json({ order: data });
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default authenticated(handler);
