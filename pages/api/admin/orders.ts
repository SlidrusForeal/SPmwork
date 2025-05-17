// pages/api/admin/orders.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated, requireRole } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import {
  validateOrderStatus,
  canTransitionToStatus,
} from "../../../lib/validation";
import type { OrderStatus } from "../../../types";

async function handler(
  req: NextApiRequest & { user: any },
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("status", "dispute")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ orders: data });
  }

  if (req.method === "PATCH") {
    const { orderId, status } = req.body;

    try {
      // Validate the new status
      const newStatus = validateOrderStatus(status);

      // Get current order status
      const { data: order, error: fetchError } = await supabaseAdmin
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (fetchError) {
        return res.status(500).json({ error: fetchError.message });
      }

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if the status transition is allowed
      if (!canTransitionToStatus(order.status as OrderStatus, newStatus)) {
        return res.status(400).json({
          error: `Cannot transition from ${order.status} to ${newStatus}`,
        });
      }

      // Update the order status
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }

      // Log the status change
      await supabaseAdmin.from("admin_logs").insert([
        {
          admin_id: req.user.id,
          action: "change_status",
          entity: "order",
          entity_id: orderId,
          metadata: {
            old_status: order.status,
            new_status: newStatus,
          },
        },
      ]);

      return res.status(200).json({ ok: true });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default authenticated(requireRole(["moderator", "admin"])(handler));
