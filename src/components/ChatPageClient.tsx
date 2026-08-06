"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isReasoningUIPart,
  isTextUIPart,
  type ChatStatus,
  type UIMessage,
} from "ai";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import StreamingMarkdownText from "@/components/StreamingMarkdownText";
import { useChatAutoScroll } from "@/hooks/useChatAutoScroll";
import { readChatMessages, writeChatMessages } from "@/lib/chat-storage";

type ChatUiPhase = "idle" | "waiting" | "streaming" | "stopping";

function deriveChatUiPhase(status: ChatStatus, stopRequested: boolean): ChatUiPhase {
  if (stopRequested && (status === "submitted" || status === "streaming")) {
    return "stopping";
  }

  if (status === "submitted") {
    return "waiting";
  }

  if (status === "streaming") {
    return "streaming";
  }

  return "idle";
}

const ASSISTANT_BUBBLE_CLASS =
  "max-w-[92%] rounded-2xl rounded-bl-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700/60 dark:bg-zinc-800/80 sm:max-w-[85%]";

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 motion-reduce:animate-none" aria-hidden="true">
      <span className="h-1.5 w-1.5 motion-safe:animate-bounce rounded-full bg-violet-400 [animation-delay:0ms] motion-reduce:animate-none" />
      <span className="h-1.5 w-1.5 motion-safe:animate-bounce rounded-full bg-violet-400 [animation-delay:150ms] motion-reduce:animate-none" />
      <span className="h-1.5 w-1.5 motion-safe:animate-bounce rounded-full bg-violet-400 [animation-delay:300ms] motion-reduce:animate-none" />
    </span>
  );
}

function ThinkingIndicator({ label = "Thinking…" }: { label?: string }) {
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

function getMessageText(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

function hasReasoningContent(message: UIMessage) {
  return message.parts
    .filter(isReasoningUIPart)
    .some((part) => part.text.trim().length > 0);
}

function AssistantMessageShell({
  children,
  className = "",
  animate = true,
}: {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}) {
  return (
    <div className={`flex justify-start ${animate ? "chat-message-enter motion-reduce:animate-none" : ""}`}>
      <div
        className={`${ASSISTANT_BUBBLE_CLASS} min-h-[52px] transition-[min-height,opacity] duration-300 motion-reduce:transition-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

function ChatMessageBubble({
  message,
  isActiveAssistant,
  animate,
}: {
  message: UIMessage;
  isActiveAssistant: boolean;
  animate: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} ${
        animate ? "chat-message-enter motion-reduce:animate-none" : ""
      }`}
    >
      <div
        className={
          isUser
            ? "max-w-[92%] rounded-2xl rounded-br-md bg-violet-600 px-4 py-2.5 text-white shadow-md shadow-violet-900/20 sm:max-w-[85%]"
            : `${ASSISTANT_BUBBLE_CLASS} min-h-[52px]`
        }
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed sm:text-[15px]">
            {getMessageText(message)}
          </p>
        ) : (
          <AssistantMessageContent
            message={message}
            isStreaming={isActiveAssistant}
          />
        )}
      </div>
    </div>
  );
}

function AssistantMessageContent({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming: boolean;
}) {
  const text = getMessageText(message);
  const reasoningParts = message.parts.filter(isReasoningUIPart);
  const hasReasoning = hasReasoningContent(message);
  const hasText = text.trim().length > 0;
  const reasoningStillStreaming = reasoningParts.some(
    (part) => part.state === "streaming",
  );
  const showThinkingPlaceholder = isStreaming && !hasText;

  return (
    <div className="space-y-2">
      {hasReasoning ? (
        <div
          className={`rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs leading-relaxed text-zinc-400 transition-opacity duration-300 motion-reduce:transition-none ${
            hasText ? "opacity-70" : "opacity-100"
          }`}
        >
          <p className="mb-1 font-medium text-violet-300/90">
            {reasoningStillStreaming && !hasText ? "Thinking…" : "Thought process"}
          </p>
          {reasoningParts.map((part, index) => (
            <p key={index} className="whitespace-pre-wrap italic">
              {part.text}
            </p>
          ))}
        </div>
      ) : null}

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
  );
}

export default function ChatPageClient() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="flex h-[min(600px,75vh)] max-h-[75vh] min-h-[320px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60" />
    );
  }

  return <ChatPageClientLoaded />;
}

function ChatPageClientLoaded() {
  const initialMessages = useMemo(() => readChatMessages(), []);
  const messageCountAtRestore = initialMessages.length;
  const [input, setInput] = useState("");
  const [stopRequestedAt, setStopRequestedAt] = useState<number | null>(null);
  const pendingSendRef = useRef<string | null>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const {
    messages,
    sendMessage,
    status,
    stop,
    regenerate,
    error,
    clearError,
  } = useChat({
    transport,
    id: "flickfocus-chat",
    messages: initialMessages,
  });

  const stopRequested =
    stopRequestedAt !== null &&
    (status === "submitted" || status === "streaming");
  const phase = deriveChatUiPhase(status, stopRequested);
  const isStreaming = phase === "streaming";
  const showStopButton = phase === "waiting" || phase === "streaming";
  const isInputDisabled = phase === "waiting" || phase === "streaming";
  const canSubmit = Boolean(input.trim()) && (phase === "idle" || phase === "stopping");

  const {
    containerRef,
    handleScroll,
    scrollToBottom,
    pinToBottom,
    followStream,
    syncScrollPin,
    isAtBottom,
  } = useChatAutoScroll();

  useEffect(() => {
    writeChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    const persistOnExit = () => {
      writeChatMessages(messages);
    };

    window.addEventListener("pagehide", persistOnExit);
    return () => window.removeEventListener("pagehide", persistOnExit);
  }, [messages]);

  useEffect(() => {
    followStream(isStreaming ? "auto" : "smooth");
  }, [messages, status, followStream, isStreaming]);

  useEffect(() => {
    syncScrollPin();
  }, [messages, status, syncScrollPin]);

  useEffect(() => {
    if (status !== "ready" || !pendingSendRef.current) {
      return;
    }

    const nextMessage = pendingSendRef.current;
    pendingSendRef.current = null;
    clearError();
    pinToBottom();
    sendMessage({ text: nextMessage });
  }, [status, sendMessage, clearError, pinToBottom]);

  const submitMessage = useCallback(
    (text: string) => {
      setStopRequestedAt(null);
      clearError();
      pinToBottom();
      sendMessage({ text });
    },
    [clearError, pinToBottom, sendMessage],
  );

  const handleStop = useCallback(() => {
    if (!showStopButton) {
      return;
    }

    setStopRequestedAt(Date.now());
    stop();
  }, [showStopButton, stop]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmed = input.trim();
      if (!trimmed || !canSubmit) {
        return;
      }

      if (phase === "stopping" || status !== "ready") {
        pendingSendRef.current = trimmed;
        setInput("");
        setStopRequestedAt(Date.now());
        stop();
        return;
      }

      setInput("");
      submitMessage(trimmed);
    },
    [canSubmit, input, phase, status, stop, submitMessage],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        event.currentTarget.form?.requestSubmit();
      }
    },
    [],
  );

  const lastMessage = messages[messages.length - 1];
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const awaitingAssistantBubble =
    phase === "waiting" &&
    messages.length > 0 &&
    lastMessage?.role === "user";

  const showJumpToLatest = !isAtBottom && messages.length > 0;
  const canRegenerate =
    phase === "idle" &&
    !error &&
    lastMessage?.role === "assistant" &&
    Boolean(getMessageText(lastMessage).trim());

  const shouldAnimateMessage = useCallback(
    (index: number) => index >= messageCountAtRestore,
    [messageCountAtRestore],
  );

  const handleRegenerate = useCallback(() => {
    if (!canRegenerate) {
      return;
    }

    clearError();
    pinToBottom();
    regenerate();
  }, [canRegenerate, clearError, pinToBottom, regenerate]);

  return (
    <div className="flex h-[min(600px,75vh)] max-h-[75vh] min-h-[320px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="relative h-full min-h-0 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-6"
          aria-live="polite"
          aria-relevant="additions text"
        >
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center px-4 py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Ask about movies
                </h2>
                <p className="mt-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
                  Get recommendations, trivia, and genre picks from your FlickFocus
                  AI assistant.
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isActiveAssistant =
                  message.role === "assistant" &&
                  message.id === lastAssistantMessage?.id &&
                  (phase === "streaming" || phase === "stopping");

                return (
                  <ChatMessageBubble
                    key={message.id}
                    message={message}
                    isActiveAssistant={isActiveAssistant}
                    animate={shouldAnimateMessage(index)}
                  />
                );
              })
            )}

            {awaitingAssistantBubble ? (
              <AssistantMessageShell animate={shouldAnimateMessage(messages.length)}>
                <ThinkingIndicator />
              </AssistantMessageShell>
            ) : null}
          </div>
        </div>

        {showJumpToLatest ? (
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="chat-control-enter motion-reduce:animate-none absolute bottom-4 left-1/2 z-[25] inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-300/80 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-lg shadow-black/25 backdrop-blur-sm transition-colors duration-200 motion-reduce:transition-none hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500/40 dark:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Jump to latest message"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
            Jump to latest
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="chat-control-enter motion-reduce:animate-none shrink-0 border-t border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          <div className="flex items-start justify-between gap-3">
            <p>{error.message || "Something went wrong. Please try again."}</p>
            <button
              type="button"
              onClick={() => clearError()}
              className="shrink-0 text-xs font-medium text-red-200 underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/40 sm:p-4"
      >
        <div className="flex items-end gap-2 sm:gap-3">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for a recommendation, genre, or film trivia…"
            rows={1}
            disabled={isInputDisabled}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />

          {showStopButton ? (
            <button
              key="stop-control"
              type="button"
              onClick={handleStop}
              className="chat-control-enter motion-reduce:animate-none inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition-colors duration-200 motion-reduce:transition-none hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              aria-label="Stop generating"
            >
              Stop
            </button>
          ) : (
            <div key="send-controls" className="flex shrink-0 items-end gap-2">
              {canRegenerate ? (
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="chat-control-enter motion-reduce:animate-none inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors duration-200 motion-reduce:transition-none hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  aria-label="Regenerate last response"
                >
                  Regenerate
                </button>
              ) : null}
              <button
                type="submit"
                disabled={!canSubmit}
                className="chat-control-enter motion-reduce:animate-none inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-md shadow-violet-900/20 transition-colors duration-200 motion-reduce:transition-none hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}
        </div>
        <p className="mt-2 hidden text-xs text-zinc-500 sm:block">
          Press Enter to send, Shift+Enter for a new line.
        </p>
      </form>
    </div>
  );
}
