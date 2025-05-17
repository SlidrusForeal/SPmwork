import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabase } from "../../../lib/supabaseClient";
import { apiLimiter } from "../../../lib/rateLimit";

async function handler(
  req: NextApiRequest & { user?: any },
  res: NextApiResponse
) {
  const userId = req.user?.id;

  if (req.method === "GET") {
    const { type, unreadOnly, before, limit = "20" } = req.query;

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    if (unreadOnly === "true") {
      query = query.is("read_at", null);
    }

    if (before) {
      query = query.lt("created_at", before);
    }

    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    query = query.limit(limitNum);

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return res
        .status(500)
        .json({ error: "Не удалось загрузить уведомления" });
    }

    return res.status(200).json({ notifications });
  }

  if (req.method === "PATCH") {
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: "Неверный формат данных" });
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids)
      .eq("user_id", userId);

    if (error) {
      console.error("Error marking notifications as read:", error);
      return res.status(500).json({ error: "Не удалось обновить уведомления" });
    }

    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

// Применяем rate limiter к обработчику
export default function notificationsWithRateLimit(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return apiLimiter(req, res, authenticated(handler));
}
