"use client";

import { useChat } from "@ai-sdk/react";
import dynamic from "next/dynamic";
import {
  DefaultChatTransport,
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
import {
  ChatMessageContent,
  getAssistantMessageText,
  ThinkingIndicator,
} from "@/components/chat/ChatAssistantMessage";
import { messageHasToolParts } from "@/components/chat/ChatToolInvocation";
import AnimatedActionButton from "@/components/ui/AnimatedActionButton";
import Button from "@/components/ui/Button";
import { useChatAutoScroll } from "@/hooks/useChatAutoScroll";
import { ANIMATED_ACTION_BUTTON, type AnimatedActionVisualState } from "@/lib/animated-action-button";
import { readChatMessages, writeChatMessages, clearChatMessages } from "@/lib/chat/chat-storage";
import { cn } from "@/lib/cn";

const MovieDetailModal = dynamic(
  () => import("@/components/movies/MovieDetailModal"),
  { ssr: false },
);

type ChatUiPhase = "idle" | "waiting" | "streaming" | "stopping";

const COMPOSER_MAX_HEIGHT_PX = 160;

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

function SendIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.99.99 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
    </svg>
  );
}

const ASSISTANT_BUBBLE_CLASS =
  "max-w-[92%] rounded-2xl rounded-bl-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700/60 dark:bg-zinc-800/80 sm:max-w-[80%] lg:max-w-[72%]";

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
  onSelectMovie,
}: {
  message: UIMessage;
  isActiveAssistant: boolean;
  animate: boolean;
  onSelectMovie: (imdbID: string) => void;
}) {
  const isUser = message.role === "user";
  const hasTools = !isUser && messageHasToolParts(message);

  return (
    <div
      className={`flex w-full min-w-0 ${isUser ? "justify-end" : "justify-start"} ${
        animate ? "chat-message-enter motion-reduce:animate-none" : ""
      }`}
    >
      <div
        className={cn(
          isUser
            ? "max-w-[min(92%,32rem)] rounded-2xl rounded-br-md bg-violet-600 px-3.5 py-2.5 text-white shadow-md shadow-violet-900/20 sm:px-4"
            : cn(
                ASSISTANT_BUBBLE_CLASS,
                hasTools &&
                  "w-full max-w-none min-w-0 border-none bg-transparent p-0 shadow-none sm:max-w-none",
              ),
        )}
      >
        {isUser ? (
          <ChatMessageContent message={message} />
        ) : (
          <ChatMessageContent
            message={message}
            isStreaming={isActiveAssistant}
            onSelectMovie={onSelectMovie}
          />
        )}
      </div>
    </div>
  );
}

function ClearChatControl({
  onConfirm,
  onConfirmingChange,
}: {
  onConfirm: () => void;
  onConfirmingChange?: (confirming: boolean) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    onConfirmingChange?.(confirming);
  }, [confirming, onConfirmingChange]);

  useEffect(() => {
    if (!confirming) {
      return;
    }

    const timeoutId = window.setTimeout(() => setConfirming(false), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [confirming]);

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          <span className="sm:hidden">Clear?</span>
          <span className="hidden sm:inline">Clear all messages?</span>
        </span>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => {
            onConfirm();
            setConfirming(false);
          }}
        >
          Clear
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => setConfirming(true)}
      className="gap-1.5 max-sm:px-2.5"
      aria-label="Clear chat history"
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916A2.25 2.25 0 0012.75 3h-1.5a2.25 2.25 0 00-2.25 2.25v.916m7.5 0a48.667 48.667 0 00-7.5 0"
        />
      </svg>
      <span className="sm:hidden">Clear</span>
      <span className="hidden sm:inline">Clear chat</span>
    </Button>
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60" />
    );
  }

  return <ChatPageClientLoaded />;
}

function ChatPageClientLoaded() {
  const initialMessages = useMemo(() => readChatMessages(), []);
  const [animateFromIndex, setAnimateFromIndex] = useState(initialMessages.length);
  const [input, setInput] = useState("");
  const [stopRequestedAt, setStopRequestedAt] = useState<number | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [sendSuccessFlash, setSendSuccessFlash] = useState(false);
  const [isClearConfirming, setIsClearConfirming] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSendRef = useRef<string | null>(null);
  const prevPhaseRef = useRef<ChatUiPhase>("idle");

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
    setMessages,
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
    if (messages.length === 0) {
      clearChatMessages();
      return;
    }

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

  // Grow the composer with its content so long prompts stay readable without
  // pushing the send button off-screen.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, COMPOSER_MAX_HEIGHT_PX)}px`;
  }, [input]);

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
    Boolean(getAssistantMessageText(lastMessage).trim());

  const sendVisualState = useMemo((): AnimatedActionVisualState => {
    if (error) {
      return "error";
    }
    if (phase === "waiting") {
      return "loading";
    }
    if (sendSuccessFlash) {
      return "success";
    }
    return "idle";
  }, [error, phase, sendSuccessFlash]);

  useEffect(() => {
    if (prevPhaseRef.current === "waiting" && phase === "streaming") {
      setSendSuccessFlash(true);
      const timeoutId = window.setTimeout(
        () => setSendSuccessFlash(false),
        ANIMATED_ACTION_BUTTON.duration.successHold,
      );
      prevPhaseRef.current = phase;
      return () => window.clearTimeout(timeoutId);
    }

    prevPhaseRef.current = phase;
  }, [phase]);

  const shouldAnimateMessage = useCallback(
    (index: number) => index >= animateFromIndex,
    [animateFromIndex],
  );

  const handleClearChat = useCallback(() => {
    if (showStopButton) {
      setStopRequestedAt(Date.now());
      stop();
    }

    pendingSendRef.current = null;
    setStopRequestedAt(null);
    setInput("");
    clearError();
    setMessages([]);
    clearChatMessages();
    setAnimateFromIndex(0);
    pinToBottom();

    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [clearError, containerRef, pinToBottom, setMessages, showStopButton, stop]);

  const handleRegenerate = useCallback(() => {
    if (!canRegenerate) {
      return;
    }

    clearError();
    pinToBottom();
    regenerate();
  }, [canRegenerate, clearError, pinToBottom, regenerate]);

  const handleSelectMovie = useCallback((imdbID: string) => {
    setSelectedMovieId(imdbID);
    setIsMovieModalOpen(true);
  }, []);

  const handleCloseMovieModal = useCallback(() => {
    setIsMovieModalOpen(false);
    setSelectedMovieId(null);
  }, []);

  const chatStatusMessage = useMemo(() => {
    if (phase === "waiting") {
      return "Waiting for assistant response.";
    }
    if (phase === "streaming") {
      return "Assistant is responding.";
    }
    if (phase === "stopping") {
      return "Stopping generation.";
    }
    return "";
  }, [phase]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {chatStatusMessage}
      </div>
      {messages.length > 0 ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800 sm:gap-3 sm:px-4">
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {messages.length} message{messages.length === 1 ? "" : "s"}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {canRegenerate && !isClearConfirming ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRegenerate}
                className="chat-control-enter motion-reduce:animate-none gap-1.5 motion-reduce:transition-none max-sm:px-2.5"
                aria-label="Regenerate last response"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992V4.356m-.001 4.992-3.181-3.183a8.25 8.25 0 0 0-13.803 3.7M4.031 9.865v4.992m0 0h4.99m-4.99 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7"
                  />
                </svg>
                <span className="sm:hidden">Retry</span>
                <span className="hidden sm:inline">Regenerate</span>
              </Button>
            ) : null}
            <ClearChatControl
              onConfirm={handleClearChat}
              onConfirmingChange={setIsClearConfirming}
            />
          </div>
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="absolute inset-0 scroll-pb-6 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-6"
          aria-label="Chat messages"
        >
          <div className="min-w-0 space-y-4 pb-12 sm:space-y-5">
            {messages.length === 0 ? (
              <div className="flex min-h-[16rem] flex-col items-center justify-center px-4 py-10 text-center sm:min-h-[20rem]">
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
                  Ask for recommendations, search OMDb live, or get ratings — tools
                  render rich movie cards inline.
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
                    onSelectMovie={handleSelectMovie}
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
          <Button
            type="button"
            variant="float"
            onClick={() => scrollToBottom("smooth")}
            className="chat-control-enter motion-reduce:animate-none absolute bottom-3 left-1/2 z-[25] max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-full px-3 py-1.5 text-xs motion-reduce:transition-none sm:bottom-4 sm:px-4 sm:py-2 sm:text-sm"
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
            <span className="sm:hidden">Latest</span>
            <span className="hidden sm:inline">Jump to latest</span>
          </Button>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="chat-control-enter motion-reduce:animate-none shrink-0 border-t border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="min-w-0 flex-1 break-words">{error.message || "Something went wrong. Please try again."}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => clearError()}
              className="shrink-0 text-red-200 underline-offset-2 hover:text-red-100"
            >
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-zinc-200 bg-zinc-50/80 px-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 dark:border-zinc-800 dark:bg-zinc-950/40 sm:px-4 sm:pb-3 sm:pt-3"
      >
        <div className="flex min-w-0 items-end gap-2 rounded-2xl border border-zinc-300 bg-white p-1.5 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/25 dark:border-zinc-700 dark:bg-zinc-900">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about movies…"
            rows={1}
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="on"
            spellCheck
            disabled={isInputDisabled}
            className="chat-input block min-h-11 w-full min-w-0 flex-1 resize-none border-0 bg-transparent px-2.5 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-100 dark:placeholder:text-zinc-400"
            style={{ maxHeight: COMPOSER_MAX_HEIGHT_PX }}
          />

          {showStopButton ? (
            <Button
              key="stop-control"
              type="button"
              variant="secondary"
              onClick={handleStop}
              className="chat-control-enter motion-reduce:animate-none h-11 shrink-0 justify-center gap-1.5 motion-reduce:transition-none"
              aria-label="Stop generating"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="7" y="7" width="10" height="10" rx="1.5" />
              </svg>
              <span className="hidden sm:inline">Stop</span>
            </Button>
          ) : (
            <AnimatedActionButton
              key="send-control"
              type="submit"
              variant="violet"
              state={sendVisualState}
              disabled={
                sendVisualState === "success" ||
                (sendVisualState === "idle" && !canSubmit)
              }
              idleLabel={
                <>
                  <SendIcon className="h-4 w-4 sm:hidden" />
                  <span className="hidden sm:inline">Send</span>
                </>
              }
              loadingLabel={<span className="hidden sm:inline">Sending</span>}
              successLabel={<span className="hidden sm:inline">Sent</span>}
              errorLabel={<span className="hidden sm:inline">Retry</span>}
              onRetry={() => clearError()}
              autoResetSuccess={false}
              aria-label="Send message"
              className="chat-control-enter motion-reduce:animate-none h-11 shrink-0 motion-reduce:transition-none sm:min-w-[5rem]"
            />
          )}
        </div>
        <p className="mt-2 hidden text-xs text-zinc-400 sm:block">
          Press Enter to send, Shift+Enter for a new line.
        </p>
      </form>

      <MovieDetailModal
        imdbID={selectedMovieId}
        isOpen={isMovieModalOpen}
        onClose={handleCloseMovieModal}
      />
    </div>
  );
}
