// pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { sp } from '../../lib/spworlds';
import { updateOrderStatus } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const hash = req.headers['x-body-hash'] as string;
    if (!sp.validateHash(req.body, hash)) {
        return res.status(403).end('Invalid signature');
    }

    const { data: orderId, amount, card_number } = req.body as any;

    try {
        await updateOrderStatus(orderId, {
            status: 'paid',
            paidAmount: parseFloat(amount),
            paidAt: new Date(),
            payerCard: card_number
        });
        res.status(200).end('OK');
    } catch (e) {
        console.error('Webhook handling error:', e);
        res.status(500).end('Internal error');
    }
}
