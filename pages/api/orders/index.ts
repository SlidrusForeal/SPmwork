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
  validOrderCategories,
} from "../../../lib/validation";
import type { Order } from "../../../types"; // Import Order type

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
  category: z.enum(validOrderCategories, {
    errorMap: () => ({ message: "Invalid category" }),
  }),
  budget: z
    .number()
    .min(1, "Budget must be at least 1")
    .max(1000000, "Budget must be at most 1,000,000"),
});

// Remove local Order type, use imported one
/*
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
*/

type ApiResponse = {
  error?: string;
  orders?: Order[];
  order?: Order;
  total?: number;
  page?: number;
  limit?: number;
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
        const {
          page = "1",
          limit = "10",
          searchTerm,
          category,
          minBudget,
          maxBudget,
          status,
          sortBy = "created_at",
          sortOrder = "desc",
        } = req.query;

        let query = supabase.from("orders").select("*", { count: "exact" });

        // Default status to 'open' if not provided, or allow specific status filter
        if (status && typeof status === "string") {
          query = query.eq("status", status);
        } else {
          query = query.eq("status", "open"); // Default to open orders
        }

        if (searchTerm && typeof searchTerm === "string") {
          // Using or condition for searching in title or description
          // For more advanced search, consider Supabase full-text search
          query = query.or(
            `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
          );
        }

        if (category && typeof category === "string") {
          query = query.eq("category", category);
        }

        if (minBudget && typeof minBudget === "string") {
          const budgetMin = parseFloat(minBudget);
          if (!isNaN(budgetMin)) {
            query = query.gte("budget", budgetMin);
          }
        }

        if (maxBudget && typeof maxBudget === "string") {
          const budgetMax = parseFloat(maxBudget);
          if (!isNaN(budgetMax)) {
            query = query.lte("budget", budgetMax);
          }
        }

        // Sorting
        const validSortBy = ["created_at", "budget"];
        const sortColumn = validSortBy.includes(sortBy as string)
          ? (sortBy as string)
          : "created_at";
        const ascending = sortOrder === "asc";
        query = query.order(sortColumn, { ascending });

        // Pagination
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const offset = (pageNum - 1) * limitNum;
        query = query.range(offset, offset + limitNum - 1);

        const { data: orders, error, count } = await query;

        if (error) {
          console.error("Error fetching orders:", error);
          throw error;
        }

        return res.status(200).json({
          orders: orders || [],
          total: count || 0, // Add total count for pagination
          page: pageNum,
          limit: limitNum,
        });
      } catch (e: any) {
        return res.status(500).json({
          error: e.message,
        });
      }
    }

    if (req.method === "POST") {
      try {
        // Use Zod schema to parse and validate the entire body
        const validatedData = OrderSchema.parse(req.body);
        const { title, description, category, budget } = validatedData;

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
              title,
              description,
              category,
              budget,
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
