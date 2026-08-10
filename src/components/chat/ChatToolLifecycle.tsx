"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ToolLifecycleState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error";

const STATE_META: Record<
  ToolLifecycleState,
  { label: string; dotClass: string; panelClass: string }
> = {
  "input-streaming": {
    label: "Receiving input",
    dotClass: "bg-amber-400 motion-safe:animate-pulse",
    panelClass: "border-amber-500/25 bg-amber-500/5",
  },
  "input-available": {
    label: "Input ready",
    dotClass: "bg-sky-400",
    panelClass: "border-sky-500/25 bg-sky-500/5",
  },
  "output-available": {
    label: "Complete",
    dotClass: "bg-emerald-400",
    panelClass: "border-emerald-500/20 bg-emerald-500/5",
  },
  "output-error": {
    label: "Failed",
    dotClass: "bg-red-400",
    panelClass: "border-red-500/25 bg-red-500/10",
  },
};

function ToolIcon({ name }: { name: string }) {
  const isSearch = name === "searchMovies";

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-neutral-900/80 text-violet-300">
      {isSearch ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      )}
    </div>
  );
}

function formatToolName(toolName: string): string {
  if (toolName === "searchMovies") {
    return "Search Movies";
  }
  if (toolName === "getMovieDetails") {
    return "Movie Details";
  }
  return toolName;
}

function InputPreview({ input }: { input: unknown }) {
  if (!input || typeof input !== "object") {
    return (
      <p className="text-xs italic text-neutral-500">Waiting for parameters…</p>
    );
  }

  const entries = Object.entries(input as Record<string, unknown>).filter(
    ([, value]) => value !== undefined && value !== "",
  );

  if (entries.length === 0) {
    return (
      <p className="text-xs italic text-neutral-500">Streaming parameters…</p>
    );
  }

  return (
    <dl className="grid gap-1.5">
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-wrap gap-x-2 text-xs">
          <dt className="font-medium uppercase tracking-wide text-neutral-500">{key}</dt>
          <dd className="break-all text-neutral-200">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ChatToolLifecycleShell({
  toolName,
  state,
  children,
  className,
}: {
  toolName: string;
  state: ToolLifecycleState;
  children: ReactNode;
  className?: string;
}) {
  const meta = STATE_META[state];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border backdrop-blur-sm transition-colors duration-300",
        meta.panelClass,
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/5 px-3 py-2.5 sm:px-4">
        <ToolIcon name={toolName} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-100">
            {formatToolName(toolName)}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} aria-hidden="true" />
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
              {meta.label}
            </p>
          </div>
        </div>
      </div>
      <div className="px-3 py-3 sm:px-4 sm:py-4">{children}</div>
    </div>
  );
}

export function ChatToolInputStreaming({
  toolName,
  input,
}: {
  toolName: string;
  input: unknown;
}) {
  return (
    <ChatToolLifecycleShell toolName={toolName} state="input-streaming">
      <InputPreview input={input} />
      <div className="mt-3 flex items-center gap-2 text-xs text-amber-200/90">
        <span className="inline-flex gap-1" aria-hidden="true">
          <span className="h-1 w-1 motion-safe:animate-bounce rounded-full bg-amber-300 [animation-delay:0ms]" />
          <span className="h-1 w-1 motion-safe:animate-bounce rounded-full bg-amber-300 [animation-delay:120ms]" />
          <span className="h-1 w-1 motion-safe:animate-bounce rounded-full bg-amber-300 [animation-delay:240ms]" />
        </span>
        Building tool request…
      </div>
    </ChatToolLifecycleShell>
  );
}

export function ChatToolInputAvailable({
  toolName,
  input,
}: {
  toolName: string;
  input: unknown;
}) {
  return (
    <ChatToolLifecycleShell toolName={toolName} state="input-available">
      <InputPreview input={input} />
      <div className="mt-3 flex items-center gap-2 text-xs text-sky-200/90">
        <svg className="h-3.5 w-3.5 motion-safe:animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Running on server…
      </div>
    </ChatToolLifecycleShell>
  );
}

export function ChatToolOutputError({
  toolName,
  errorText,
  input,
}: {
  toolName: string;
  errorText: string;
  input?: unknown;
}) {
  return (
    <ChatToolLifecycleShell toolName={toolName} state="output-error">
      {input ? (
        <div className="mb-3 opacity-70">
          <InputPreview input={input} />
        </div>
      ) : null}
      <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-2.5">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <div className="min-w-0">
          <p className="text-sm font-medium text-red-200">Tool failed safely</p>
          <p className="mt-1 break-words text-sm text-red-300/90">{errorText}</p>
        </div>
      </div>
    </ChatToolLifecycleShell>
  );
}
