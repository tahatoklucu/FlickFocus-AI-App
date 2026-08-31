"use client";

import { cn } from "@/lib/cn";

interface SearchPaginationProps {
  page: number;
  totalPages: number;
  totalResults: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
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
        d={direction === "left" ? "M15.75 19.5L8.25 12l7.5-7.5" : "M8.25 4.5l7.5 7.5-7.5 7.5"}
      />
    </svg>
  );
}

const stepClass =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 text-sm font-medium text-neutral-200 transition hover:border-neutral-600 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-neutral-800 disabled:hover:bg-neutral-900/70";

export default function SearchPagination({
  page,
  totalPages,
  totalResults,
  isLoading = false,
  onPageChange,
}: SearchPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      aria-label="Search results pages"
      className="mt-8 flex flex-col items-center gap-3 border-t border-neutral-800/80 pt-6 sm:flex-row sm:justify-between"
    >
      <p className="text-sm text-neutral-400" aria-live="polite">
        Page <span className="font-semibold text-neutral-200">{page}</span> of{" "}
        <span className="font-semibold text-neutral-200">{totalPages}</span>
        <span className="hidden sm:inline"> · {totalResults.toLocaleString("en-US")} matches</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={stepClass}
          onClick={() => onPageChange(page - 1)}
          disabled={isLoading || page <= 1}
          aria-label="Previous page"
        >
          <ArrowIcon direction="left" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {pages.map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => onPageChange(entry)}
            disabled={isLoading}
            aria-label={`Page ${entry}`}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              "min-h-9 min-w-9 rounded-lg border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed",
              entry === page
                ? "border-violet-400/40 bg-violet-500/20 text-violet-100"
                : "border-neutral-800 bg-neutral-900/70 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800 disabled:opacity-40",
            )}
          >
            {entry}
          </button>
        ))}

        <button
          type="button"
          className={stepClass}
          onClick={() => onPageChange(page + 1)}
          disabled={isLoading || page >= totalPages}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ArrowIcon direction="right" />
        </button>
      </div>
    </nav>
  );
}
