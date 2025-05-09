// pages/api/messages.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../lib/auth";
import { supabase } from "../../lib/supabaseClient";

async function handler(
  req: NextApiRequest & { user?: any },
  res: NextApiResponse
) {
  const userId = req.user?.id;
  const orderId = req.query.orderId as string;
  if (!orderId) {
    return res.status(400).json({ error: "Missing orderId" });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ messages: data });
  }

  if (req.method === "POST") {
    const { content } = req.body as { content: string };
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Invalid content" });
    }
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          order_id: orderId,
          sender_id: userId,
          content,
        },
      ])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ message: data });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default authenticated(handler);
