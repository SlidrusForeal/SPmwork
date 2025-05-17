import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabase } from "../../../lib/supabaseClient";
import { apiLimiter } from "../../../lib/rateLimit";

async function handler(
  req: NextApiRequest & { user?: any },
  res: NextApiResponse
) {
  const userId = req.user?.id;

  if (req.method === "POST") {
    const { reported_id, order_id, message_id, reason } = req.body;

    if (!reported_id || !reason) {
      return res.status(400).json({ error: "Не все поля заполнены" });
    }

    try {
      const { data: report, error } = await supabase
        .from("reports")
        .insert([
          {
            reporter_id: userId,
            reported_id,
            order_id,
            message_id,
            reason,
          },
        ])
        .single();

      if (error) throw error;

      // Отправляем уведомление администраторам
      const { data: admins } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin");

      if (admins) {
        const notifications = admins.map((admin) => ({
          user_id: admin.id,
          type: "system_alert",
          title: "Новая жалоба",
          message: `Поступила новая жалоба от пользователя`,
          link: `/admin?tab=reports&id=${report.id}`,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      return res.status(200).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      return res.status(500).json({ error: "Не удалось создать жалобу" });
    }
  }

  if (req.method === "GET") {
    const { status } = req.query;

    try {
      let query = supabase
        .from("reports")
        .select(
          `
          *,
          reporter:users!reports_reporter_id_fkey (
            username,
            minecraft_username
          ),
          reported:users!reports_reported_id_fkey (
            username,
            minecraft_username
          ),
          order:orders (
            id,
            title
          ),
          message:messages (
            id,
            content
          )
        `
        )
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data: reports, error } = await query;

      if (error) throw error;

      return res.status(200).json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      return res.status(500).json({ error: "Не удалось загрузить жалобы" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default function reportsWithRateLimit(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return apiLimiter(req, res, authenticated(handler));
}
