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
      const discordId = req.user.id as string;
      // Ищем пользователя по его Discord-ID
      const owner: any = await sp.findUser(discordId);
      if (!owner) {
        return res
          .status(404)
          .json({ error: "SPWorlds: пользователь не найден" });
      }

      // Сохраняем в Supabase
      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          minecraft_username: owner.username,
          minecraft_uuid: owner.minecraftUUID,
          sp_status: owner.status ?? null,
        })
        .eq("id", discordId)
        .select()
        .single();

      if (error) {
        console.error("Ошибка обновления пользователя SPWorlds:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ user: data });
    } catch (e: any) {
      console.error("SPWorlds profile error:", e);
      return res.status(500).json({ error: e.message || "Internal error" });
    }
  }
);
