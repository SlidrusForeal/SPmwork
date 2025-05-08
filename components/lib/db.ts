// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export async function query(text: string, params: any[] = []) {
    const res = await pool.query(text, params);
    return res;
}

export async function updateOrderStatus(
    orderId: string,
    data: {
        status: string;
        paidAmount: number;
        paidAt: Date;
        payerCard: string;
    }
) {
    const { status, paidAmount, paidAt, payerCard } = data;
    await query(
        `
    UPDATE orders
    SET status = $1,
        paid_amount = $2,
        paid_at = $3,
        payer_card = $4
    WHERE id = $5
  `,
        [status, paidAmount, paidAt.toISOString(), payerCard, orderId]
    );
}
