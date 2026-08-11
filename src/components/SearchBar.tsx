"use client";

import { FormEvent, useCallback } from "react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
      />
    </svg>
  );
}

export default function SearchBar({
  query,
  onQueryChange,
  onSearch,
  onClear,
  isLoading = false,
}: SearchBarProps) {
  const handleQueryChange = useCallback(
    (value: string) => {
      onQueryChange(value);

      if (!value.trim()) {
        onClear?.();
      }
    },
    [onClear, onQueryChange],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="hidden shrink-0 sm:flex sm:h-12 sm:w-12 sm:items-center sm:justify-center sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/[0.06] sm:shadow-lg sm:shadow-violet-950/25 sm:backdrop-blur-md"
          aria-hidden="true"
        >
          <SearchIcon className="h-5 w-5 text-white/75" />
        </div>

        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 sm:hidden" aria-hidden="true">
            <SearchIcon className="h-5 w-5 text-neutral-500" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Search for a movie..."
            disabled={isLoading}
            className={cn(
              "min-h-12 w-full rounded-xl border border-neutral-800 bg-neutral-900/70 py-3 pr-4 text-neutral-50 shadow-inner shadow-black/20 placeholder:text-neutral-500 backdrop-blur-sm transition focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60",
              "pl-12 sm:pl-4",
            )}
            aria-label="Search for a movie"
          />
        </div>

        <Button
          type="submit"
          variant="violet"
          disabled={isLoading || !query.trim()}
          className="w-full sm:min-w-[120px] sm:w-auto"
        >
          {isLoading ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Searching
            </>
          ) : (
            "Search"
          )}
        </Button>
      </div>
    </form>
  );
}
