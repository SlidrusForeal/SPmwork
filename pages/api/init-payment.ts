// pages/api/init-payment.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sp } from "../../lib/spworlds";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  const { orderId, amount } = req.body as { orderId: string; amount: number };
  try {
    const url = await sp.initPayment({
      items: [
        {
          name: `Order #${orderId}`,
          count: 1, // число
          price: amount, // число
          comment: `Freelance-заказ ${orderId}`,
        },
      ],
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/success?order=${orderId}`,
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`,
      data: orderId,
    });
    return res.status(200).json({ url });
  } catch (e) {
    console.error("SP initPayment error:", e);
    return res.status(500).json({ error: "Payment init failed" });
  }
}
