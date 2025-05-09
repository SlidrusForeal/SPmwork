// pages/api/init-payment.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { orderId, amount } = req.body as { orderId: string; amount: number };
  const key = Buffer.from(
    `${process.env.SPWORLDS_ID}:${process.env.SPWORLDS_TOKEN}`
  ).toString("base64");

  try {
    const apiRes = await fetch("https://spworlds.ru/api/public/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        amount,
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/success?order=${orderId}`,
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`,
        data: orderId,
      }),
    });

    const text = await apiRes.text();
    if (!apiRes.ok) {
      console.error("SPWorlds payment error:", text);
      throw new Error(`Payment init failed: ${apiRes.status}`);
    }
    const { url } = JSON.parse(text);
    return res.status(200).json({ url });
  } catch (e: any) {
    console.error("Init-payment handler error:", e);
    return res.status(500).json({ error: "Payment init failed" });
  }
}
