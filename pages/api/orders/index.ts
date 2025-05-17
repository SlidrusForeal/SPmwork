// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabase } from "../../../lib/supabaseClient";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import {
  validateOrderTitle,
  validateOrderDescription,
  validateOrderPrice,
} from "../../../lib/validation";

export default authenticated(
  async (req: NextApiRequest & { user: any }, res: NextApiResponse) => {
    const userId = req.user.id;

    if (req.method === "GET") {
      // пагинация
      const page = parseInt((req.query.page as string) || "1", 10);
      const limit = parseInt((req.query.limit as string) || "10", 10);
      const from = (page - 1) * limit;
      const to = page * limit - 1;

      const { q, category, minBudget, maxBudget, status, dateFrom, dateTo } =
        req.query;

      let builder = supabase
        .from("orders")
        .select("*", { count: "exact" })
        .or(`status.eq.open,buyer_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (q) builder = builder.ilike("title", `%${q}%`);
      if (category) builder = builder.eq("category", category as string);
      if (minBudget) builder = builder.gte("budget", Number(minBudget));
      if (maxBudget) builder = builder.lte("budget", Number(maxBudget));
      if (status) builder = builder.eq("status", status as string);
      if (dateFrom) builder = builder.gte("created_at", dateFrom as string);
      if (dateTo) builder = builder.lte("created_at", dateTo as string);

      const { data, error, count } = await builder;
      if (error) {
        console.error("Ошибка получения заказов:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ orders: data, total: count });
    }

    if (req.method === "POST") {
      try {
        const { title, description, category, budget } = req.body;

        // Validate all fields
        const validatedTitle = validateOrderTitle(title);
        const validatedDescription = validateOrderDescription(description);
        const validatedBudget = validateOrderPrice(budget);

        if (!category || typeof category !== "string") {
          throw new Error("Category is required");
        }

        // Check user's active orders count using raw SQL to handle enum type
        const { count: activeOrders, error: countError } = await supabase
          .from("orders")
          .select("*", { count: "exact" })
          .eq("buyer_id", userId)
          .or(
            "status.eq.open::order_status_enum,status.eq.in_progress::order_status_enum"
          );

        if (countError) {
          console.error("Error checking active orders:", countError);
          throw new Error("Failed to check active orders");
        }

        if (activeOrders && activeOrders >= 10) {
          return res.status(400).json({
            error: "You cannot have more than 10 active orders",
          });
        }

        // Create the order
        const { data, error } = await supabaseAdmin
          .from("orders")
          .insert([
            {
              buyer_id: userId,
              title: validatedTitle,
              description: validatedDescription,
              category,
              budget: validatedBudget,
              status: "open",
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("Ошибка создания заказа:", error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(201).json({ order: data });
      } catch (e: any) {
        console.error("Error creating order:", e);
        return res.status(400).json({ error: e.message });
      }
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
);
