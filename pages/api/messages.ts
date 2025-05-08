import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticated } from '../../lib/auth';
import { supabase } from '../../lib/supabaseClient';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const userId = (req.user as any).id;
    const orderId = req.query.orderId as string;

    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });
        if (error) return res.status(500).json({ error: 'Ошибка получения сообщений' });
        return res.status(200).json({ messages: data });
    }

    if (req.method === 'POST') {
        const { content } = req.body;
        const { data, error } = await supabase
            .from('messages')
            .insert([{ order_id: orderId, sender_id: userId, content }])
            .select()
            .single();
        if (error) return res.status(500).json({ error: 'Ошибка отправки сообщения' });
        return res.status(201).json({ message: data });
    }

    res.status(405).end();
}

export default authenticated(handler);
