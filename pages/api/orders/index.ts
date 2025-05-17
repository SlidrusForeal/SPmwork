// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabase } from "../../../lib/supabaseClient";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { apiLimiter } from "../../../lib/rateLimit";
import { z } from "zod";
import {
  validateOrderTitle,
  validateOrderDescription,
  validateOrderPrice,
  validateOrderCategory,
} from "../../../lib/validation";

// Order validation schema
const OrderSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters long")
    .max(100, "Title must be at most 100 characters long"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters long")
    .max(2000, "Description must be at most 2000 characters long"),
  category: z.enum(["DESIGN", "DEVELOPMENT", "MODDING", "OTHER"], {
    errorMap: () => ({ message: "Invalid category" }),
  }),
  budget: z
    .number()
    .min(1, "Budget must be at least 1")
    .max(1000000, "Budget must be at most 1,000,000"),
});

type Order = {
  id: number;
  buyer_id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: string;
  created_at: string;
};

type ApiResponse = {
  error?: string;
  orders?: Order[];
  order?: Order;
};

// Extend NextApiRequest to include the user property added by authentication
interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    username: string;
    minecraft_username?: string;
    minecraft_uuid?: string;
    role: string;
  };
}

export default authenticated(
  async (
    req: AuthenticatedRequest,
    res: NextApiResponse<ApiResponse>
  ): Promise<void | NextApiResponse<ApiResponse>> => {
    const userId = req.user.id; // Using string Discord ID directly

    if (req.method === "GET") {
      try {
        const { data: orders, error } = await supabase
          .from("orders")
          .select("*")
          .eq("buyer_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        return res.status(200).json({ orders: orders || [] });
      } catch (e: any) {
        return res.status(500).json({
          error: e.message,
        });
      }
    }

    if (req.method === "POST") {
      try {
        const { title, description, category, budget } = req.body;

        // Validate all fields
        const validatedTitle = validateOrderTitle(title);
        const validatedDescription = validateOrderDescription(description);
        const validatedBudget = validateOrderPrice(budget);
        const validatedCategory = validateOrderCategory(category);

        // Using string Discord ID for buyer_id
        const buyerId = req.user.id;

        const { data, error: countError } = await supabase.rpc(
          "count_active_orders",
          { user_id: buyerId }
        );

        const activeOrders = data || 0;

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
              buyer_id: buyerId,
              title: validatedTitle,
              description: validatedDescription,
              category: validatedCategory,
              budget: validatedBudget,
              status: "open",
            },
          ])
          .select()
          .single();

        if (error) {
          throw error;
        }

        return res.status(201).json({ order: newOrder });
      } catch (e: any) {
        return res.status(500).json({
          error: e.message,
        });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  }
);
