// pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { sp } from '../../lib/spworlds';
import { supabaseAdmin } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const hash = req.headers['x-body-hash'] as string;
    if (!sp.validateHash(req.body, hash)) return res.status(403).end('Invalid signature');

    const { data: orderId, amount, card_number } = req.body as any;
    try {
        await supabaseAdmin
            .from('orders')
            .update({ status: 'in_progress', paid_amount: parseFloat(amount), paid_at: new Date().toISOString(), payer_card: card_number })
            .eq('id', orderId);
        return res.status(200).end('OK');
    } catch (e) {
        console.error('Webhook handling error:', e);
        return res.status(500).end('Internal error');
    }
}
