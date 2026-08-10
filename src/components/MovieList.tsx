"use client";

import { memo } from "react";
import MovieNotFound from "@/components/MovieNotFound";
import type { MovieSearchResult } from "@/types";
import MovieCard from "./MovieCard";

interface MovieListProps {
  movies: MovieSearchResult[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  onMovieSelect: (imdbID: string) => void;
  loadingMessage?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  showInitialPrompt?: boolean;
  resultLabel?: string;
  priorityCount?: number;
  hideResultLabel?: boolean;
}

function MovieList({
  movies,
  isLoading,
  error,
  hasSearched,
  onMovieSelect,
  loadingMessage = "Searching movies...",
  emptyTitle = "No movies found",
  emptySubtitle = "Try a different search term",
  showInitialPrompt = true,
  resultLabel,
  priorityCount = 6,
  hideResultLabel = false,
}: MovieListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-neutral-500">
        <svg
          className="h-8 w-8 animate-spin"
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
        <p className="text-sm font-medium">{loadingMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center dark:border-red-900/50 dark:bg-red-950/30"
      >
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          {error}
        </p>
      </div>
    );
  }

  if (!hasSearched && showInitialPrompt) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center text-neutral-500">
        <svg
          className="mb-2 h-12 w-12 opacity-40"
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
        <p className="text-sm font-medium">Search for a movie to get started</p>
        <p className="text-xs">Try &quot;Inception&quot;, &quot;Matrix&quot;, or &quot;Interstellar&quot;</p>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <MovieNotFound
        title={emptyTitle}
        description={emptySubtitle}
      />
    );
  }

  return (
    <div>
      {!hideResultLabel && (
        <p className="mb-4 text-sm text-neutral-500">
          {resultLabel ??
            `${movies.length} result${movies.length === 1 ? "" : "s"} found`}
        </p>
      )}
      <ul className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {movies.map((movie, index) => (
          <li key={movie.imdbID} className="flex">
            <MovieCard
              movie={movie}
              onSelect={onMovieSelect}
              priority={index < priorityCount}
              className="w-full"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default memo(MovieList);
