// pages/api/init-payment.ts
import { z } from "zod";
import { apiHandler } from "../../lib/apiHandler";
import { sp } from "../../lib/spworlds";
import { paymentLimiter } from "../../lib/rateLimit";
import { NextApiRequest, NextApiResponse } from "next";

const InitPaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
});

if (!process.env.WEBHOOK_BASE_URL) {
  throw new Error("❌ WEBHOOK_BASE_URL environment variable is not set");
}

const handler = apiHandler(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end("Method Not Allowed");
    return;
  }

  const parse = InitPaymentSchema.safeParse(req.body);
  if (!parse.success) {
    res
      .status(400)
      .json({ error: "Неверные параметры", details: parse.error.format() });
    return;
  }
  const { orderId, amount } = parse.data;

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
      webhookUrl: `${process.env.WEBHOOK_BASE_URL}/api/webhook`,
      data: orderId,
    });
    res.status(200).json({ url });
    return;
  } catch (e: any) {
    console.error("Ошибка SPWorlds initPayment:", e);
    const status = e.statusCode || 500;
    const message = e.message || "Ошибка платёжного API";
    const details = e.response?.body || null;
    res.status(status).json({ error: message, details });
    return;
  }
});

// Apply rate limiter to the handler
export default function initPaymentWithRateLimit(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return paymentLimiter(req, res, handler);
}
