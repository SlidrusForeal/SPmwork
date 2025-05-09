// pages/api/init-payment.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sp } from "../../lib/spworlds";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ url?: string; error?: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  const { orderId, amount } = req.body as {
    orderId: string;
    amount: number;
  };

  if (!orderId || typeof amount !== "number") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  try {
    const { url } = await sp.initPayment({
      items: [
        {
          name: `Заказ ${orderId}`,
          count: 1,
          price: amount,
          comment: "",
        },
      ],
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/success?order=${orderId}`,
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`,
      data: orderId,
    });

    return res.status(200).json({ url });
  } catch (error) {
    console.error("SPWorlds initPayment error:", error);
    return res.status(500).json({ error: "Payment init failed" });
  }
}
