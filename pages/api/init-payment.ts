// pages/api/init-payment.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { orderId, amount } = req.body as {
    orderId: string;
    amount: number;
  };
  const spId = process.env.SPWORLDS_ID?.trim();
  const spToken = process.env.SPWORLDS_TOKEN?.trim();
  if (!spId || !spToken) {
    console.error("❌ SPWorlds credentials missing");
    return res
      .status(500)
      .json({ error: "SPWorlds ID или TOKEN не настроены" });
  }

  const spKey = Buffer.from(`${spId}:${spToken}`, "utf8").toString("base64");
  const url = "https://spworlds.ru/api/public/payment";
  console.error("SPWorlds POST:", url);
  console.error("Auth:", `Bearer ${spKey}`);
  console.error("Body:", { amount, orderId });

  try {
    const apiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${spKey}`,
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
      console.error("SP initPayment error:", text);
      throw new Error(`Payment init failed: ${apiRes.status}`);
    }
    console.error("SP initPayment response:", text);
    const { url: paymentUrl } = JSON.parse(text);
    return res.status(200).json({ url: paymentUrl });
  } catch (e: any) {
    console.error("Init-payment handler error:", e);
    return res.status(500).json({ error: "Payment init failed" });
  }
}
