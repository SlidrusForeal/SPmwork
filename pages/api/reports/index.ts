import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabase } from "../../../lib/supabaseClient";
import { apiLimiter } from "../../../lib/rateLimit";
import type { JWTPayload } from "../../../lib/auth";

interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  order_id?: string;
  message_id?: string;
  reason: string;
  status: "pending" | "resolved" | "rejected";
  admin_comment?: string;
  created_at: string;
  resolved_at?: string;
}

async function handler(
  req: NextApiRequest & { user: JWTPayload },
  res: NextApiResponse
): Promise<void> {
  const userId = req.user.id;

  if (req.method === "POST") {
    const { reported_id, order_id, message_id, reason } = req.body;

    if (!reported_id || !reason) {
      res.status(400).json({ error: "Не все поля заполнены" });
      return;
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
        .select()
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
          type: "system_alert" as const,
          title: "Новая жалоба",
          message: `Поступила новая жалоба от пользователя`,
          link: `/admin?tab=reports&id=${(report as Report).id}`,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      res.status(200).json(report);
      return;
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ error: "Не удалось создать жалобу" });
      return;
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

      res.status(200).json(reports);
      return;
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Не удалось загрузить жалобы" });
      return;
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
  return;
}

export default function reportsWithRateLimit(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return apiLimiter(req, res, authenticated(handler));
}
