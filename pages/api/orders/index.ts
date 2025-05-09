// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabase } from "../../../lib/supabaseClient";

async function handler(
  req: NextApiRequest & { user: any },
  res: NextApiResponse
) {
  const userId = req.user.id;

  if (req.method === "GET") {
    const { q, category, minBudget, maxBudget, status, dateFrom, dateTo } =
      req.query;
    let builder = supabase
      .from("orders")
      .select("*")
      .or(`status.eq.open,buyer_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (q) builder = builder.ilike("title", `%${q}%`);
    if (category) builder = builder.eq("category", category as string);
    if (minBudget) builder = builder.gte("budget", Number(minBudget));
    if (maxBudget) builder = builder.lte("budget", Number(maxBudget));
    if (status) builder = builder.eq("status", status as string);
    if (dateFrom) builder = builder.gte("created_at", dateFrom as string);
    if (dateTo) builder = builder.lte("created_at", dateTo as string);

    const { data, error } = await builder;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ orders: data });
  }

  if (req.method === "POST") {
    const { title, description, category, budget } = req.body;
    const { data, error } = await supabase
      .from("orders")
      .insert([{ buyer_id: userId, title, description, category, budget }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: "Ошибка создания заказа" });
    return res.status(201).json({ order: data });
  }

  res.status(405).end();
}

export default authenticated(handler);
