// pages/api/init-payment.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { SPWorlds } from "spworlds";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { orderId, amount } = req.body as { orderId: string; amount: number };
  if (req.method !== "POST") return res.status(405).end();

  try {
    const sp = new SPWorlds({
      id: process.env.SPWORLDS_ID!,
      token: process.env.SPWORLDS_TOKEN!,
    });
    // Логируем запрос
    console.error("SP initPayment request body:", {
      items: [{ name: `Order #${orderId}`, count: 1, price: amount }],
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/success?order=${orderId}`,
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`,
      data: orderId,
    });

    // Вместо sp.initPayment делаем fetch
    const apiRes = await fetch("https://api.spworlds.ru/init-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SPWORLDS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [
          {
            name: `Order #${orderId}`,
            count: 1,
            price: amount,
            comment: `Freelance-заказ ${orderId}`,
          },
        ],
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/success?order=${orderId}`,
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`,
        data: orderId,
      }),
    });

    const text = await apiRes.text();
    console.error("SP initPayment response status:", apiRes.status);
    console.error("SP initPayment response body:", text);

    if (!apiRes.ok) throw new Error(`SP init failed: ${apiRes.status}`);

    const { url } = JSON.parse(text);
    return res.status(200).json({ url });
  } catch (e: any) {
    console.error("SP initPayment full error:", e);
    return res.status(500).json({ error: "Payment init failed" });
  }
}
