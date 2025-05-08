// pages/api/orders/[orderId]/offers/[offerId]/accept.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticated } from '../../../../../lib/auth';
import { supabase, supabaseAdmin } from '../../../../../lib/supabaseClient';

async function handler(req: NextApiRequest & { user: any }, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const offerId = req.query.offerId as string;

    // fetch order_id
    const { data: offer, error: fetchErr } = await supabase
        .from('offers')
        .select('order_id')
        .eq('id', offerId)
        .single();
    if (fetchErr) return res.status(500).json({ error: 'Ошибка обработки оффера' });

    const orderId = offer!.order_id;

    // accept offer
    await supabaseAdmin.from('offers').update({ status: 'accepted' }).eq('id', offerId);
    // update order status
    await supabaseAdmin.from('orders').update({ status: 'in_progress' }).eq('id', orderId);

    return res.status(200).json({ ok: true });
}

export default authenticated(handler);
