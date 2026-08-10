import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { flickFocusChatTools } from "@/lib/chat-tools";
import {
  CHAT_MODEL_ID,
  FLICKFOCUS_CHAT_SYSTEM_PROMPT,
} from "@/lib/chat-system-prompt";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      { error: "Chat is not configured. Missing GOOGLE_GENERATIVE_AI_API_KEY." },
      { status: 503 },
    );
  }

  let messages: UIMessage[];

  try {
    ({ messages } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Array.isArray(messages)) {
    return Response.json({ error: "Messages must be an array." }, { status: 400 });
  }

  try {
    const result = streamText({
      model: google(CHAT_MODEL_ID),
      system: FLICKFOCUS_CHAT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
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
