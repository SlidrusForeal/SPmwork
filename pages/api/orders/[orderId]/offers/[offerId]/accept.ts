// pages/api/orders/[orderId]/offers/[offerId]/accept.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../../../../lib/auth";
import { supabase } from "../../../../../../lib/supabaseClient";
import { supabaseAdmin } from "../../../../../../lib/supabaseAdmin";
import {
  validateOrderStatus,
  canTransitionToStatus,
} from "../../../../../../lib/validation";
import type { OrderStatus } from "../../../../../../types";

async function handler(
  req: NextApiRequest & { user: any },
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const offerId = req.query.offerId as string;

  try {
    // Fetch offer and order details
    const { data: offer, error: fetchOfferErr } = await supabase
      .from("offers")
      .select("order_id, status")
      .eq("id", offerId)
      .single();

    if (fetchOfferErr) {
      return res.status(500).json({ error: "Error fetching offer" });
    }

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Check if offer is already accepted
    if (offer.status === "accepted") {
      return res.status(400).json({ error: "Offer is already accepted" });
    }

    // Get current order status
    const { data: order, error: fetchOrderErr } = await supabase
      .from("orders")
      .select("status")
      .eq("id", offer.order_id)
      .single();

    if (fetchOrderErr) {
      return res.status(500).json({ error: "Error fetching order" });
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Validate status transition
    const currentStatus = order.status as OrderStatus;
    const newStatus = "in_progress" as OrderStatus;

    if (!canTransitionToStatus(currentStatus, newStatus)) {
      return res.status(400).json({
        error: `Cannot transition order from ${currentStatus} to ${newStatus}`,
      });
    }

    // Begin transaction
    const { error: acceptErr } = await supabaseAdmin.rpc("accept_offer", {
      p_offer_id: offerId,
      p_order_id: offer.order_id,
      p_new_status: newStatus,
    });

    if (acceptErr) {
      return res.status(500).json({ error: "Failed to accept offer" });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("Error accepting offer:", e);
    return res
      .status(500)
      .json({ error: e.message || "Internal server error" });
  }
}

export default authenticated(handler);
