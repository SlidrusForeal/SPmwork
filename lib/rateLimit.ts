import { Redis } from "@upstash/redis";
import { NextApiRequest, NextApiResponse } from "next";

if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
) {
  throw new Error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export function createRateLimiter({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 100, // Limit each IP to 100 requests per windowMs
  keyPrefix = "ratelimit",
}: RateLimitConfig) {
  return async function rateLimiterMiddleware(
    req: NextApiRequest,
    res: NextApiResponse,
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
  ) {
    // Get IP from various headers or default to a placeholder
    const ip =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.socket.remoteAddress ||
      "unknown";

    const key = `${keyPrefix}:${ip}`;

    try {
      const [current] = await redis
        .pipeline()
        .incr(key)
        .expire(key, Math.ceil(windowMs / 1000))
        .exec();

      const remaining = Math.max(max - (current as number), 0);
      const reset = Date.now() + windowMs;

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", reset);

      if ((current as number) > max) {
        return res.status(429).json({
          error: "Too many requests, please try again later",
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      // Continue to the actual handler
      return handler(req, res);
    } catch (error) {
      console.error("Rate limit error:", error);
      // Continue even if rate limiting fails
      return handler(req, res);
    }
  };
}

// Predefined limiters for different use cases
export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  keyPrefix: "ratelimit:auth",
});

export const paymentLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  keyPrefix: "ratelimit:payment",
});

export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  keyPrefix: "ratelimit:api",
});
