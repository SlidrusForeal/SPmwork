// pages/api/init-payment.ts
import { z } from "zod";
import { apiHandler } from "../../lib/apiHandler";
import { sp } from "../../lib/spworlds";

const InitPaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
});

export default apiHandler(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  const parse = InitPaymentSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.format() });
  }
  const { orderId, amount } = parse.data;

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
});
