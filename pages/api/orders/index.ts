// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabase } from "../../../lib/supabaseClient";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export default authenticated(
  async (req: NextApiRequest & { user: any }, res: NextApiResponse) => {
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
      if (error) {
        console.error("Ошибка получения заказов:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ orders: data });
    }

    if (req.method === "POST") {
      const { title, description, category, budget } = req.body;
      if (!title || !description || typeof budget !== "number") {
        return res.status(400).json({ error: "Неправильные данные заказа" });
      }

      try {
        const { data, error } = await supabaseAdmin
          .from("orders")
          .insert([{ buyer_id: userId, title, description, category, budget }])
          .select()
          .single();
        if (error) {
          console.error("Ошибка создания заказа:", error);
          return res.status(500).json({ error: error.message });
        }
        return res.status(201).json({ order: data });
      } catch (e: any) {
        console.error("Unexpected error при создании заказа:", e);
        return res
          .status(500)
          .json({ error: e.message || "Internal Server Error" });
      }
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
);
