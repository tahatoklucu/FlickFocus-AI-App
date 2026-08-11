import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { validateChatMessages } from "@/lib/api/api-limits";
import { enforceRateLimit } from "@/lib/api/api-rate-limit";
import { flickFocusChatTools } from "@/lib/chat/chat-tools";
import {
  CHAT_MODEL_ID,
  FLICKFOCUS_CHAT_SYSTEM_PROMPT,
} from "@/lib/chat/chat-system-prompt";

export const maxDuration = 30;

export async function POST(req: Request) {
  const rateLimited = enforceRateLimit(req, "chat");
  if (rateLimited) {
    return rateLimited;
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      { error: "Chat is not configured. Missing GOOGLE_GENERATIVE_AI_API_KEY." },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = (body as { messages?: unknown })?.messages;
  const validationError = validateChatMessages(messages);

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  try {
    const result = streamText({
      model: google(CHAT_MODEL_ID),
      system: FLICKFOCUS_CHAT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages as UIMessage[]),
      tools: flickFocusChatTools,
      stopWhen: isStepCount(5),
      abortSignal: req.signal,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        sendReasoning: true,
      }),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to generate a response. Please try again." },
      { status: 500 },
    );
  }
}
