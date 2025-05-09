// pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

async function me(req: NextApiRequest & { user: any }, res: NextApiResponse) {
  const userId = req.user.id;
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(
      "id, discord_username, minecraft_username, minecraft_uuid, role, created_at"
    )
    .eq("id", userId)
    .single();

  if (error) {
    return res.status(500).json({ error: "Ошибка получения профиля" });
  }

  res.status(200).json({
    user: {
      id: data.id,
      username: data.discord_username,
      minecraftUsername: data.minecraft_username,
      minecraftUuid: data.minecraft_uuid,
      role: data.role,
      created_at: data.created_at,
    },
  });
}

export default authenticated(me);
