// pages/api/orders/[orderId].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabase } from "../../../lib/supabaseClient";

async function handler(
  req: NextApiRequest & { user?: any },
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { orderId } = req.query as { orderId: string };
  const userId = req.user?.id;

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Error fetching order:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only allow access if the order is open or the user is the buyer or an admin
    // Assuming req.user.role might exist from your 'authenticated' middleware
    const userIsAdmin = req.user?.role === "admin";
    if (data.status !== "open" && data.buyer_id !== userId && !userIsAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Fetch offers for the order
    const { data: offers, error: offersError } = await supabase
      .from("offers")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (offersError) {
      console.error("Error fetching offers for order:", orderId, offersError);
      // Decide if you want to return partial data or an error
      // For now, returning order data even if offers fail, but logging the error.
      // Depending on requirements, you might want to return res.status(500).json({ error: offersError.message });
    }

    return res.status(200).json({ order: data, offers: offers || [] });
  } catch (e: any) {
    console.error("Unexpected error fetching order:", e);
    return res
      .status(500)
      .json({ error: e.message || "Internal Server Error" });
  }
}

export default authenticated(handler);
