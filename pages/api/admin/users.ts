// pages/api/admin/users.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated, requireRole } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

async function handler(
  req: NextApiRequest & { user: any },
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, discord_username, role, created_at");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ users: data });
  }

  if (req.method === "PATCH") {
    const { userId, role } = req.body;
    const { error } = await supabaseAdmin
      .from("users")
      .update({ role })
      .eq("id", userId);
    if (error) return res.status(500).json({ error: error.message });

    await supabaseAdmin.from("admin_logs").insert([
      {
        admin_id: req.user.id,
        action: "change_role",
        entity: "user",
        entity_id: userId,
      },
    ]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default authenticated(requireRole(["moderator", "admin"])(handler));
