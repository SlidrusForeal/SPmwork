// pages/api/profile/minecraft.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { sp } from "../../../lib/spworlds";

export default authenticated(
  async (req: NextApiRequest & { user: any }, res: NextApiResponse) => {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
      // Получаем профиль пользователя SPWorlds (включая Minecraft-ник и UUID)
      const owner = await sp.getCardOwner();
      // owner.username — ник Minecraft на СП
      // owner.minecraftUUID — привязанный UUID
      // owner.status — статус на сайте СП

      // Сохраняем в Supabase
      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          minecraft_username: owner.username,
          minecraft_uuid: owner.minecraftUUID,
          sp_status: owner.status || null,
        })
        .eq("id", req.user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return res.status(200).json({ user: data });
    } catch (e: any) {
      console.error("SPWorlds profile error:", e);
      return res.status(500).json({ error: e.message || "Internal error" });
    }
  }
);
