import { describe, expect, it } from "vitest";
import {
  API_LIMITS,
  clampSearchQuery,
  isValidImdbIdParam,
  validateChatMessages,
} from "@/lib/api/api-limits";
import { checkRateLimit, resetRateLimitStore } from "@/lib/api/api-rate-limit";

describe("api-limits", () => {
  it("clamps search queries", () => {
    const long = "a".repeat(200);
    expect(clampSearchQuery(long).length).toBe(API_LIMITS.search.maxQueryLength);
  });

  it("validates imdb ids", () => {
    expect(isValidImdbIdParam("tt0133093")).toBe(true);
    expect(isValidImdbIdParam("invalid")).toBe(false);
  });

  it("rejects oversized chat payloads", () => {
    const messages = Array.from({ length: API_LIMITS.chat.maxMessages + 1 }, () => ({
      parts: [{ type: "text", text: "hi" }],
    }));

    expect(validateChatMessages(messages)).toMatch(/Too many messages/);
  });
});

describe("api-rate-limit", () => {
  it("blocks after max requests in window", () => {
    resetRateLimitStore();
    const config = { windowMs: 60_000, max: 2 };

    expect(checkRateLimit("test-ip", config).allowed).toBe(true);
    expect(checkRateLimit("test-ip", config).allowed).toBe(true);
    expect(checkRateLimit("test-ip", config).allowed).toBe(false);
  });
});
