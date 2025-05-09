// pages/api/orders/[orderId]/offers/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../../../lib/auth";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

async function handler(
  req: NextApiRequest & { user?: any },
  res: NextApiResponse
) {
  const userId = req.user!.id;
  const { orderId } = req.query as { orderId: string };

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("offers")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Ошибка получения офферов:", error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ offers: data });
  }

  if (req.method === "POST") {
    const { price, delivery_time, message } = req.body as {
      price: number;
      delivery_time: number;
      message: string;
    };

    const { data, error } = await supabaseAdmin
      .from("offers")
      .insert([
        {
          order_id: orderId,
          seller_id: userId,
          price,
          delivery_time,
          message,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Ошибка создания оффера:", error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ offer: data });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default authenticated(handler);
