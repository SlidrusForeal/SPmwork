// pages/api/init-payment.ts
import { z } from "zod";
import { apiHandler } from "../../lib/apiHandler";
import { sp } from "../../lib/spworlds";
import { paymentLimiter } from "../../lib/rateLimit";

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
    return res.status(405).end("Method Not Allowed");
  }

  const parse = InitPaymentSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: "Неверные параметры", details: parse.error.format() });
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
    return res.status(200).json({ url });
  } catch (e: any) {
    // Если SPWorlds вернул 422 Unprocessable Entity, в e.response есть тело ответа
    console.error("Ошибка SPWorlds initPayment:", e);
    const status = e.statusCode || 500;
    const message = e.message || "Ошибка платёжного API";
    // попробуем достать детали из тела
    const details = e.response?.body || null;
    return res.status(status).json({ error: message, details });
  }
});

export default paymentLimiter(handler);
