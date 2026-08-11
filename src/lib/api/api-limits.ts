/** Shared input caps for public API routes. */
export const API_LIMITS = {
  chat: {
    maxMessages: 40,
    maxBodyBytes: 100_000,
    maxPartTextLength: 4_000,
  },
  search: {
    maxQueryLength: 120,
    maxPage: 5,
  },
  imdbId: {
    maxLength: 20,
    pattern: /^tt\d{5,10}$/i,
  },
  rateLimit: {
    chat: { windowMs: 60_000, max: 20 },
    api: { windowMs: 60_000, max: 120 },
  },
} as const;

export function clampSearchQuery(query: string): string {
  return query.trim().slice(0, API_LIMITS.search.maxQueryLength);
}

export function isValidImdbIdParam(id: string): boolean {
  const trimmed = id.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= API_LIMITS.imdbId.maxLength &&
    API_LIMITS.imdbId.pattern.test(trimmed)
  );
}

export function estimateChatPayloadSize(messages: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(messages)).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

/** Reject oversized or empty chat transcripts before hitting the model. */
export function validateChatMessages(messages: unknown): string | null {
  if (!Array.isArray(messages)) {
    return "Messages must be an array.";
  }

  if (messages.length === 0) {
    return "At least one message is required.";
  }

  if (messages.length > API_LIMITS.chat.maxMessages) {
    return `Too many messages (max ${API_LIMITS.chat.maxMessages}).`;
  }

  if (estimateChatPayloadSize(messages) > API_LIMITS.chat.maxBodyBytes) {
    return "Request payload is too large.";
  }

  for (const message of messages) {
    if (!message || typeof message !== "object") {
      return "Invalid message format.";
    }

    const parts = (message as { parts?: unknown }).parts;
    if (!Array.isArray(parts)) {
      continue;
    }

    for (const part of parts) {
      if (!part || typeof part !== "object") {
        continue;
      }

      const text = (part as { text?: unknown }).text;
      if (
        typeof text === "string" &&
        text.length > API_LIMITS.chat.maxPartTextLength
      ) {
        return `Message text exceeds ${API_LIMITS.chat.maxPartTextLength} characters.`;
      }
    }
  }

  return null;
}
