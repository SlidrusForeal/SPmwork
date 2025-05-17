import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { Redis } from "@upstash/redis";

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

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 100, // Limit each IP to 100 requests per windowMs
  keyPrefix = "ratelimit",
} = {}) =>
  rateLimit({
    windowMs,
    max,
    message: { error: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      // @ts-ignore - Upstash Redis types are not fully compatible with rate-limit-redis
      client: redis,
      prefix: keyPrefix,
      resetExpiryOnChange: true,
    }),
  });

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
