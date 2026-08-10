"use client";

import { isReasoningUIPart, isTextUIPart, type UIMessage } from "ai";
import ChatToolInvocation, { getChatToolParts } from "@/components/chat/ChatToolInvocation";
import StreamingMarkdownText from "@/components/StreamingMarkdownText";
import { cn } from "@/lib/cn";

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 motion-reduce:animate-none" aria-hidden="true">
      <span className="h-1.5 w-1.5 motion-safe:animate-bounce rounded-full bg-violet-400 [animation-delay:0ms] motion-reduce:animate-none" />
      <span className="h-1.5 w-1.5 motion-safe:animate-bounce rounded-full bg-violet-400 [animation-delay:150ms] motion-reduce:animate-none" />
      <span className="h-1.5 w-1.5 motion-safe:animate-bounce rounded-full bg-violet-400 [animation-delay:300ms] motion-reduce:animate-none" />
    </span>
  );
}

export function ThinkingIndicator({ label = "Thinking…" }: { label?: string }) {
  return (
    <div
      className="chat-thinking-pulse motion-reduce:animate-none flex min-h-[28px] items-center gap-2 text-sm text-zinc-400 transition-opacity duration-300 motion-reduce:transition-none"
      aria-live="polite"
      aria-busy="true"
    >
      <ThinkingDots />
      <span>{label}</span>
    </div>
  );
}

export function getAssistantMessageText(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

export function hasAssistantReasoningContent(message: UIMessage): boolean {
  return message.parts
    .filter(isReasoningUIPart)
    .some((part) => part.text.trim().length > 0);
}

export interface ChatAssistantMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
  onSelectMovie?: (imdbID: string) => void;
}

export default function ChatAssistantMessage({
  message,
  isStreaming = false,
  onSelectMovie,
}: ChatAssistantMessageProps) {
  const text = getAssistantMessageText(message);
  const toolParts = getChatToolParts(message);
  const reasoningParts = message.parts.filter(isReasoningUIPart);
  const hasReasoning = hasAssistantReasoningContent(message);
  const hasText = text.trim().length > 0;
  const hasTools = toolParts.length > 0;
  const reasoningStillStreaming = reasoningParts.some(
    (part) => part.state === "streaming",
  );
  const showThinkingPlaceholder = isStreaming && !hasText && !hasTools;

  return (
    <div className="space-y-3">
      {toolParts.map((part) => (
        <ChatToolInvocation
          key={part.toolCallId}
          part={part}
          onSelectMovie={onSelectMovie}
        />
      ))}

      {hasReasoning ? (
        <div
          className={cn(
            "rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs leading-relaxed text-zinc-400 transition-opacity duration-300 motion-reduce:transition-none",
            hasTools ? "bg-neutral-900/40" : "",
            hasText || hasTools ? "opacity-70" : "opacity-100",
          )}
        >
          <p className="mb-1 font-medium text-violet-300/90">
            {reasoningStillStreaming && !hasText && !hasTools
              ? "Thinking…"
              : "Thought process"}
          </p>
          {reasoningParts.map((part, index) => (
            <p key={index} className="whitespace-pre-wrap italic">
              {part.text}
            </p>
          ))}
        </div>
      ) : null}

      {(hasText || showThinkingPlaceholder) && (
        <div
          className={cn(
            hasTools &&
              "rounded-2xl rounded-bl-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700/60 dark:bg-zinc-800/80",
          )}
        >
          <div className="relative min-h-[28px]">
            {showThinkingPlaceholder && !hasReasoning ? (
              <div
                className={`transition-opacity duration-300 motion-reduce:transition-none ${
                  hasText ? "pointer-events-none absolute inset-x-0 opacity-0" : "opacity-100"
                }`}
              >
                <ThinkingIndicator />
              </div>
            ) : null}

            {hasText ? (
              <div className="chat-text-reveal motion-reduce:animate-none">
                <StreamingMarkdownText text={text} isStreaming={isStreaming && hasText} />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export function ChatUserMessage({ message }: { message: UIMessage }) {
  return (
    <p className="break-words whitespace-pre-wrap text-sm leading-relaxed sm:text-[15px]">
      {getAssistantMessageText(message)}
    </p>
  );
}

export function ChatMessageContent({
  message,
  isStreaming = false,
  onSelectMovie,
}: {
  message: UIMessage;
  isStreaming?: boolean;
  onSelectMovie?: (imdbID: string) => void;
}) {
  if (message.role === "user") {
    return <ChatUserMessage message={message} />;
  }

  return (
    <ChatAssistantMessage
      message={message}
      isStreaming={isStreaming}
      onSelectMovie={onSelectMovie}
    />
  );
}
