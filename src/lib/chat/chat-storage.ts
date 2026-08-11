import type { UIMessage } from "ai";

const STORAGE_KEY = "flickfocus:chat:messages";
const STORAGE_VERSION = 1;

type StoredChatPayload = {
  version: number;
  messages: UIMessage[];
  savedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidUIMessage(value: unknown): value is UIMessage {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.id !== "string" || typeof value.role !== "string") {
    return false;
  }

  if (value.role !== "user" && value.role !== "assistant" && value.role !== "system") {
    return false;
  }

  return Array.isArray(value.parts);
}

function normalizeMessages(raw: unknown): UIMessage[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(isValidUIMessage);
}

function parseStoredPayload(raw: string): UIMessage[] {
  const parsed: unknown = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return normalizeMessages(parsed);
  }

  if (isRecord(parsed) && Array.isArray(parsed.messages)) {
    return normalizeMessages(parsed.messages);
  }

  return [];
}

export function readChatMessages(): UIMessage[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    return parseStoredPayload(raw);
  } catch {
    return [];
  }
}

export function writeChatMessages(messages: UIMessage[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: StoredChatPayload = {
      version: STORAGE_VERSION,
      messages: normalizeMessages(messages),
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function clearChatMessages(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}

export function hasStoredChatMessages(): boolean {
  return readChatMessages().length > 0;
}
