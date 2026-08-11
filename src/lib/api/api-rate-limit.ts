import { API_LIMITS } from "@/lib/api/api-limits";

type RateLimitConfig = {
  windowMs: number;
  max: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/** Best-effort in-memory limiter (per serverless instance). */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  if (bucket.count >= config.max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "anonymous";
  }

  return request.headers.get("x-real-ip")?.trim() || "anonymous";
}

export function enforceRateLimit(
  request: Request,
  scope: "chat" | "api",
): Response | null {
  const config =
    scope === "chat" ? API_LIMITS.rateLimit.chat : API_LIMITS.rateLimit.api;
  const key = `${scope}:${getClientIp(request)}`;
  const result = checkRateLimit(key, config);

  if (result.allowed) {
    return null;
  }

  return Response.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSec),
      },
    },
  );
}

/** @internal Test helper */
export function resetRateLimitStore() {
  buckets.clear();
}
