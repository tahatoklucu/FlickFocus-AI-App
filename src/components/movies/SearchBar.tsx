"use client";

import { FormEvent, useCallback } from "react";
import Button from "@/components/ui/Button";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
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
    <form onSubmit={handleSubmit} className="mx-auto w-full">
      <div className="flex items-stretch gap-2 sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Search for a movie..."
            disabled={isLoading}
            className="min-h-11 w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-neutral-50 shadow-inner shadow-black/20 placeholder:text-neutral-500 transition focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-12 sm:px-5"
            aria-label="Search for a movie"
          />
        </div>

        <Button
          type="submit"
          variant="violet"
          size="lg"
          disabled={isLoading || !query.trim()}
          className="shrink-0 px-4 sm:min-w-[7.5rem] sm:px-6"
        >
          {isLoading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
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
              <span className="hidden sm:inline">Searching</span>
            </>
          ) : (
            "Search"
          )}
        </Button>
      </div>
    </form>
  );
}
