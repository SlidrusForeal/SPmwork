// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabase } from "../../../lib/supabaseClient";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { apiLimiter } from "../../../lib/rateLimit";
import { z } from "zod";

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

interface OrderRecord {
  id: string;
  buyer_id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: string;
  created_at: string;
  updated_at: string;
}

type ApiResponse = {
  error?: string;
  details?: z.ZodError["errors"];
  orders?: OrderRecord[];
  order?: OrderRecord;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

const handler = async (
  req: NextApiRequest & { user: any },
  res: NextApiResponse<ApiResponse>
) => {
  const userId = req.user.id; // Using direct Discord ID

  if (req.method === "GET") {
    try {
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
        console.error("Error fetching orders:", userOrdersError);
        return res.status(500).json({ error: userOrdersError.message });
      }

      return res.status(200).json(userOrders);
    } catch (e: any) {
      console.error("Error in orders GET endpoint:", e);
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === "POST") {
    try {
      // Validate request body using Zod schema
      const result = OrderSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid data",
          details: result.error.errors,
        });
      }

      const validatedData = result.data;

      // Check active orders limit
      const { data: countData, error: countError } = await supabase.rpc(
        "count_active_orders",
        { user_id: userId }
      );

      if (countError) {
        console.error("Error checking active orders:", countError);
        throw new Error("Failed to check active orders");
      }

      const activeOrders = typeof countData === "number" ? countData : 0;
      if (activeOrders >= 10) {
        return res.status(400).json({
          error: "You cannot have more than 10 active orders",
        });
      }

      // Create the order using direct Discord ID
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
        console.error("Error creating order:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ order: newOrder });
    } catch (e: any) {
      console.error("Error in orders POST endpoint:", e);
      return res.status(400).json({ error: e.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
};

// Apply rate limiter to the authenticated handler
export default function ordersWithRateLimit(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return apiLimiter(req, res, authenticated(handler));
}
