import type { NextApiRequest, NextApiResponse } from "next";
import { authenticated } from "../../../lib/auth";
import { supabase } from "../../../lib/supabaseClient";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { apiLimiter } from "../../../lib/rateLimit";
import { z } from "zod";

interface ReviewRecord {
  id: string;
  order_id?: string;
  message_id?: string;
  reviewer_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

interface UserRecord {
  id: string;
  discord_username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
}

interface EnrichedReview {
  id: string;
  orderId?: string;
  messageId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    id: string;
    username: string;
    minecraftUsername?: string;
    minecraftUuid?: string;
  };
}

// Schema for review creation
const ReviewSchema = z.object({
  order_id: z.string().uuid().optional(),
  message_id: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000).optional(),
});

type ApiResponse = {
  error?: string;
  details?: z.ZodError["errors"];
  reviews?: EnrichedReview[];
  review?: ReviewRecord;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

const handler = async (
  req: NextApiRequest & { user: any },
  res: NextApiResponse<ApiResponse>
) => {
  const userId = req.user.id;

  if (req.method === "GET") {
    try {
      // 1. Fetch reviews with pagination
      const page = parseInt((req.query.page as string) || "1", 10);
      const limit = parseInt((req.query.limit as string) || "10", 10);
      const offset = (page - 1) * limit;

      const {
        data: reviews,
        error: reviewsError,
        count,
      } = await supabase
        .from("reviews")
        .select(
          "id, order_id, message_id, reviewer_id, rating, comment, created_at",
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
        return res.status(500).json({ error: reviewsError.message });
      }

      // 2. Fetch user details for reviewers
      const reviewerIds = Array.from(
        new Set((reviews || []).map((r) => r.reviewer_id))
      );
      let users: UserRecord[] = [];

      if (reviewerIds.length > 0) {
        const { data: userData, error: usersError } = await supabase
          .from("users")
          .select("id, discord_username, minecraft_username, minecraft_uuid")
          .in("id", reviewerIds);

        if (usersError) {
          console.error("Error fetching users:", usersError);
          return res.status(500).json({ error: usersError.message });
        }

        users = userData || [];
      }

      // 3. Map users by ID for efficient lookup
      const userMap: Record<string, UserRecord> = {};
      users.forEach((u) => {
        userMap[u.id] = u;
      });

      // 4. Enrich reviews with reviewer info
      const enrichedReviews = (reviews || []).map((r) => ({
        id: r.id,
        orderId: r.order_id,
        messageId: r.message_id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        reviewer: {
          id: r.reviewer_id,
          username: userMap[r.reviewer_id]?.discord_username || "Unknown User",
          minecraftUsername: userMap[r.reviewer_id]?.minecraft_username,
          minecraftUuid: userMap[r.reviewer_id]?.minecraft_uuid,
        },
      }));

      return res.status(200).json({
        reviews: enrichedReviews,
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (e: any) {
      console.error("Error in reviews GET endpoint:", e);
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === "POST") {
    try {
      // Validate request body
      const result = ReviewSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid data",
          details: result.error.errors,
        });
      }

      const validatedData = result.data;

      // Create the review
      const { data: newReview, error } = await supabase
        .from("reviews")
        .insert([
          {
            reviewer_id: userId,
            order_id: validatedData.order_id,
            message_id: validatedData.message_id,
            rating: validatedData.rating,
            comment: validatedData.comment,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating review:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ review: newReview });
    } catch (e: any) {
      console.error("Error in reviews POST endpoint:", e);
      return res.status(400).json({ error: e.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
};

// Apply rate limiter to the authenticated handler
export default function reviewsWithRateLimit(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return apiLimiter(req, res, authenticated(handler));
}
