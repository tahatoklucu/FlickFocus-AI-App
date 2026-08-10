"use client";

import type { UIMessage } from "ai";
import {
  isChatToolPartType,
  type ChatMovieDetailsOutput,
  type ChatMovieSearchOutput,
} from "@/types/chat-tools";
import ChatMovieDetailCard from "./ChatMovieDetailCard";
import ChatMovieSearchResults from "./ChatMovieSearchResults";
import {
  ChatToolInputAvailable,
  ChatToolInputStreaming,
  ChatToolOutputError,
} from "./ChatToolLifecycle";

type ToolPart = Extract<
  UIMessage["parts"][number],
  { type: `tool-${string}` }
>;

function getToolName(part: ToolPart): string {
  return part.type.replace(/^tool-/, "");
}

function isToolPart(part: UIMessage["parts"][number]): part is ToolPart {
  return isChatToolPartType(part.type);
}

interface ChatToolInvocationProps {
  part: ToolPart;
  onSelectMovie?: (imdbID: string) => void;
}

export default function ChatToolInvocation({
  part,
  onSelectMovie,
}: ChatToolInvocationProps) {
  const toolName = getToolName(part);

  switch (part.state) {
    case "input-streaming":
      return <ChatToolInputStreaming toolName={toolName} input={part.input} />;

    case "input-available":
      return <ChatToolInputAvailable toolName={toolName} input={part.input} />;

    case "output-error":
      return (
        <ChatToolOutputError
          toolName={toolName}
          errorText={part.errorText ?? "Something went wrong while running this tool."}
          input={part.input}
        />
      );

    case "output-available":
      if (part.type === "tool-searchMovies") {
        return (
          <ChatMovieSearchResults
            output={part.output as ChatMovieSearchOutput}
            onSelectMovie={onSelectMovie}
          />
        );
      }

      if (part.type === "tool-getMovieDetails") {
        return (
          <ChatMovieDetailCard
            output={part.output as ChatMovieDetailsOutput}
            onOpenDetails={onSelectMovie}
          />
        );
      }

      return (
        <ChatToolOutputError
          toolName={toolName}
          errorText="Unexpected tool result type."
          input={part.input}
        />
      );

    default:
      return null;
  }
}

export function getChatToolParts(message: UIMessage): ToolPart[] {
  return message.parts.filter(isToolPart);
}

export function messageHasToolParts(message: UIMessage): boolean {
  return message.parts.some(isToolPart);
}
