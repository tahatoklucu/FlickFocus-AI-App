"use client";

import { prepareStreamingMarkdown, renderStreamingMarkdownHtml } from "@/lib/streaming-markdown";
import { useMemo } from "react";

type StreamingMarkdownTextProps = {
  text: string;
  isStreaming: boolean;
  className?: string;
};

export default function StreamingMarkdownText({
  text,
  isStreaming,
  className = "",
}: StreamingMarkdownTextProps) {
  const safeText = useMemo(
    () => prepareStreamingMarkdown(text, isStreaming),
    [text, isStreaming],
  );

  const html = useMemo(
    () => renderStreamingMarkdownHtml(text, isStreaming),
    [text, isStreaming],
  );

  if (!safeText.trim()) {
    return null;
  }

  return (
    <div
      className={`streaming-markdown max-w-full break-words text-sm leading-relaxed text-zinc-100 sm:text-[15px] [&_code]:break-all [&_code]:rounded [&_code]:bg-zinc-700/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_em]:italic [&_pre]:my-2 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-900/80 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_p+p]:mt-2 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
