// pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { sp } from "../../lib/spworlds";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

// Define the webhook payload schema
const WebhookPayloadSchema = z.object({
  data: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  card_number: z.string(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify request method
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  // Verify signature
  const hash = req.headers["x-body-hash"] as string;
  if (!hash || !sp.validateHash(req.body, hash)) {
    return res.status(403).end("Invalid signature");
  }

  // Validate payload
  const parseResult = WebhookPayloadSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.error("Invalid webhook payload:", parseResult.error);
    return res.status(400).json({ error: "Invalid payload format" });
  }

  const { data: orderId, amount, card_number } = parseResult.data;

  try {
    // Start a transaction
    const { data, error } = await supabaseAdmin.rpc("process_payment", {
      p_order_id: orderId,
      p_amount: parseFloat(amount),
      p_card_number: card_number,
    });

    if (error) {
      console.error("Payment processing error:", error);
      return res.status(500).json({ error: "Failed to process payment" });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error("Webhook handling error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
