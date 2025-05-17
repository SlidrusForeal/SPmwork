// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabase } from "../../../lib/supabaseClient";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { snowflakeToUuid } from "../../../lib/utils";
import { OrderSchema } from "../../../lib/schemas";

export default authenticated(
  async (req: NextApiRequest & { user: any }, res: NextApiResponse) => {
    const userId = snowflakeToUuid(req.user.id);

    if (req.method === "GET") {
      try {
        // First get the proper UUID for the user
        const { data: userOrders, error: userOrdersError } = await supabase.rpc(
          "get_user_orders",
          {
            p_user_id: userId,
            p_page: parseInt((req.query.page as string) || "1", 10),
            p_limit: parseInt((req.query.limit as string) || "10", 10),
            p_category: req.query.category as string | null,
            p_min_budget: req.query.minBudget
              ? Number(req.query.minBudget)
              : null,
            p_max_budget: req.query.maxBudget
              ? Number(req.query.maxBudget)
              : null,
            p_status: req.query.status as string | null,
            p_date_from: req.query.dateFrom as string | null,
            p_date_to: req.query.dateTo as string | null,
            p_search: req.query.q as string | null,
          }
        );

        if (userOrdersError) {
          console.error("Ошибка получения заказов:", userOrdersError);
          return res.status(500).json({ error: userOrdersError.message });
        }

        return res.status(200).json(userOrders);
      } catch (e: any) {
        console.error("Ошибка получения заказов:", e);
        return res.status(500).json({ error: e.message });
      }
    }

    if (req.method === "POST") {
      try {
        // Validate request body using Zod schema
        const result = OrderSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            error: "Неверные данные",
            details: result.error.errors,
          });
        }

        const validatedData = result.data;

        // Check user's active orders count
        const { data, error: countError } = await supabase.rpc(
          "count_active_orders",
          { user_id: userId }
        );

        if (countError) {
          console.error("Error checking active orders:", countError);
          throw new Error("Failed to check active orders");
        }

        const activeOrders = typeof data === "number" ? data : 0;

        if (activeOrders >= 10) {
          return res.status(400).json({
            error: "You cannot have more than 10 active orders",
          });
        }

        // Create the order
        const { data: newOrder, error } = await supabaseAdmin
          .from("orders")
          .insert([
            {
              buyer_id: userId,
              title: validatedData.title,
              description: validatedData.description,
              category: validatedData.category,
              budget: validatedData.budget,
              status: "open",
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("Ошибка создания заказа:", error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(201).json({ order: newOrder });
      } catch (e: any) {
        console.error("Error creating order:", e);
        return res.status(400).json({ error: e.message });
      }
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
);
