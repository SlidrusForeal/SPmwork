import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabase } from "../../../lib/supabaseClient";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

type SortOrder = "latest" | "oldest" | "highest" | "lowest";

async function handler(
  req: NextApiRequest & { user?: any },
  res: NextApiResponse
) {
  const userId = req.user?.id;

  // GET /api/reviews - получить отзывы
  if (req.method === "GET") {
    const {
      orderId,
      userId: targetUserId,
      sort = "latest",
      minRating,
      maxRating,
      hasComment,
      page = "1",
      limit = "10",
    } = req.query;

    // Validate sort order
    if (!["latest", "oldest", "highest", "lowest"].includes(sort as string)) {
      return res.status(400).json({ error: "Invalid sort order" });
    }

    // Base query
    let query = supabase.from("reviews").select(
      `
        *,
        reviewer:users!reviews_reviewer_id_fkey (
          id,
          discord_username,
          minecraft_username,
          minecraft_uuid
        )
      `
    );

    // Apply filters
    if (orderId) {
      query = query.eq("order_id", orderId);
    }
    if (targetUserId) {
      query = query.eq("reviewer_id", targetUserId);
    }
    if (minRating) {
      query = query.gte("rating", parseInt(minRating as string));
    }
    if (maxRating) {
      query = query.lte("rating", parseInt(maxRating as string));
    }
    if (hasComment === "true") {
      query = query.not("comment", "is", null);
    }

    // Apply sorting
    switch (sort) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "highest":
        query = query.order("rating", { ascending: false });
        break;
      case "lowest":
        query = query.order("rating", { ascending: true });
        break;
      default: // latest
        query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching reviews:", error);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }

    // Transform data
    const reviews = data.map((review) => ({
      id: review.id,
      orderId: review.order_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      reviewer: {
        id: review.reviewer.id,
        username: review.reviewer.discord_username,
        minecraftUsername: review.reviewer.minecraft_username,
        minecraftUuid: review.reviewer.minecraft_uuid,
      },
    }));

    return res.status(200).json({
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        hasMore: count ? from + reviews.length < count : false,
      },
    });
  }

  // POST /api/reviews - создать отзыв
  if (req.method === "POST") {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Invalid review data" });
    }

    try {
      // Проверяем, существует ли уже отзыв для этого заказа
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("order_id", orderId)
        .single();

      if (existingReview) {
        return res
          .status(400)
          .json({ error: "Review already exists for this order" });
      }

      // Создаем отзыв и обновляем статус заказа
      const { data, error } = await supabaseAdmin.rpc("create_review", {
        p_order_id: orderId,
        p_reviewer_id: userId,
        p_rating: rating,
        p_comment: comment,
      });

      if (error) {
        console.error("Error creating review:", error);
        return res.status(500).json({ error: "Failed to create review" });
      }

      return res.status(201).json({ review: data });
    } catch (e) {
      console.error("Unexpected error creating review:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default authenticated(handler);
