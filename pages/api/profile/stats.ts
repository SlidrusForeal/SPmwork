import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabase } from "../../../lib/supabaseClient";

async function handler(
  req: NextApiRequest & { user?: any },
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Получаем общее количество заказов пользователя
    const { count: totalOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact" })
      .eq("buyer_id", userId);

    // Получаем количество выполненных заказов
    const { count: completedOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact" })
      .eq("buyer_id", userId)
      .eq("status", "completed");

    // Получаем средний рейтинг пользователя
    const { data: ratings } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewer_id", userId);

    const averageRating =
      ratings && ratings.length > 0
        ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length
        : 0;

    // Получаем количество сообщений пользователя
    const { count: totalMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact" })
      .eq("sender_id", userId);

    return res.status(200).json({
      stats: {
        totalOrders: totalOrders || 0,
        completedOrders: completedOrders || 0,
        averageRating,
        totalMessages: totalMessages || 0,
      },
    });
  } catch (e: any) {
    console.error("Error fetching user stats:", e);
    return res.status(500).json({ error: "Failed to fetch user statistics" });
  }
}

export default authenticated(handler);
