import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticated } from '../../../lib/auth';
import { supabase, supabaseAdmin } from '../../../lib/supabaseClient';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const offerId = req.query.id as string;

    if (req.method === 'POST') {
        // Узнаём order_id у оффера
        const { data: offer, error: fetchError } = await supabase
            .from('offers')
            .select('order_id')
            .eq('id', offerId)
            .single();
        if (fetchError) return res.status(500).json({ error: 'Ошибка обработки оффера' });

        const orderId = offer!.order_id;

        // Принятие оффера
        const { error: offErr } = await supabaseAdmin
            .from('offers')
            .update({ status: 'accepted' })
            .eq('id', offerId);
        if (offErr) return res.status(500).json({ error: 'Не удалось принять оффер' });

        // Обновление статуса заказа
        const { error: ordErr } = await supabaseAdmin
            .from('orders')
            .update({ status: 'in_progress' })
            .eq('id', orderId);
        if (ordErr) return res.status(500).json({ error: 'Не удалось обновить заказ' });

        return res.status(200).json({ ok: true });
    }

    res.status(405).end();
}

export default authenticated(handler);
