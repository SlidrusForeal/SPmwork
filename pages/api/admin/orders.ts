// pages/api/admin/orders.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated, requireRole } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

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
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status })
      .eq("id", orderId);
    if (error) return res.status(500).json({ error: error.message });

    await supabaseAdmin.from("admin_logs").insert([
      {
        admin_id: req.user.id,
        action: "change_status",
        entity: "order",
        entity_id: orderId,
      },
    ]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default authenticated(requireRole(["moderator", "admin"])(handler));
