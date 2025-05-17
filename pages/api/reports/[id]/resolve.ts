import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabaseClient";
import { apiLimiter } from "../../../../lib/rateLimit";

async function handler(
  req: NextApiRequest & { user?: any },
  res: NextApiResponse
) {
  const userId = req.user?.id;
  const reportId = req.query.id as string;

  // Проверяем права администратора
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (!userData || userData.role !== "admin") {
    return res.status(403).json({ error: "Недостаточно прав" });
  }

  if (req.method === "POST") {
    const { action, comment } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Неверное действие" });
    }

    try {
      // Получаем данные жалобы
      const { data: report } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (!report) {
        return res.status(404).json({ error: "Жалоба не найдена" });
      }

      // Обновляем статус жалобы
      const { error: updateError } = await supabase
        .from("reports")
        .update({
          status: action === "approve" ? "resolved" : "rejected",
          admin_comment: comment,
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
        })
        .eq("id", reportId);

      if (updateError) throw updateError;

      // Если жалоба одобрена, применяем санкции
      if (action === "approve") {
        const { error: banError } = await supabase
          .from("users")
          .update({
            is_banned: true,
            ban_reason: comment,
          })
          .eq("id", report.reported_id);

        if (banError) throw banError;

        // Отправляем уведомление забаненному пользователю
        await supabase.from("notifications").insert([
          {
            user_id: report.reported_id,
            type: "system_alert",
            title: "Аккаунт заблокирован",
            message: `Ваш аккаунт был заблокирован по причине: ${comment}`,
          },
        ]);
      }

      // Отправляем уведомление автору жалобы
      await supabase.from("notifications").insert([
        {
          user_id: report.reporter_id,
          type: "system_alert",
          title: "Жалоба рассмотрена",
          message: `Ваша жалоба была ${
            action === "approve" ? "одобрена" : "отклонена"
          }`,
          link: `/reports/${reportId}`,
        },
      ]);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error resolving report:", error);
      return res.status(500).json({ error: "Не удалось обработать жалобу" });
    }
  }

  res.setHeader("Allow", ["POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default function resolveReportWithRateLimit(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return apiLimiter(req, res, authenticated(handler));
}
