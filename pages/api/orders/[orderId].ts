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

    // Only allow access if the order is open or the user is the buyer
    if (data.status !== "open" && data.buyer_id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.status(200).json({ order: data });
  } catch (e: any) {
    console.error("Unexpected error fetching order:", e);
    return res
      .status(500)
      .json({ error: e.message || "Internal Server Error" });
  }
}

export default authenticated(handler);
