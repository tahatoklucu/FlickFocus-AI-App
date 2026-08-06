"use client";

import Link from "next/link";

interface MovieNotFoundProps {
  title?: string;
  description?: string;
  compact?: boolean;
  onClose?: () => void;
  onSearchAgain?: () => void;
}

export default function MovieNotFound({
  title = "Movie not found",
  description = "We couldn't find a match in the OMDb catalog. Try a different title or check the spelling.",
  compact = false,
  onClose,
  onSearchAgain,
}: MovieNotFoundProps) {
  return (
    <div
      className={`flex flex-col items-center text-center ${
        compact ? "gap-3 py-8" : "gap-4 py-16"
      }`}
      role="status"
    >
      <div
        className={`flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 ${
          compact ? "h-14 w-14" : "h-20 w-20"
        }`}
      >
        <svg
          className={`text-zinc-400 ${compact ? "h-7 w-7" : "h-10 w-10"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
          />
        </svg>
      </div>

      <div className="max-w-sm px-4">
        <h3
          className={`font-semibold text-zinc-900 dark:text-zinc-50 ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          {title}
        </h3>
        <p
          className={`mt-2 text-zinc-500 dark:text-zinc-400 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {description}
        </p>
      </div>

      {(onClose || onSearchAgain) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {onSearchAgain && (
            <button
              type="button"
              onClick={onSearchAgain}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Try another search
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Close
            </button>
          )}
        </div>
      )}

      {!onClose && !onSearchAgain && !compact && (
        <Link
          href="/"
          className="mt-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Back to Home
        </Link>
      )}
    </div>
  );
}
