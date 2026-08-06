"use client";

import Image from "next/image";
import type { KeyboardEvent } from "react";
import FavoriteButton from "@/components/FavoriteButton";
import type { MovieSearchResult } from "@/types";

interface MovieCardProps {
  movie: MovieSearchResult;
  onSelect: (imdbID: string) => void;
}

function hasValidPoster(poster: string): boolean {
  return poster !== "N/A" && poster.trim().length > 0;
}

export default function MovieCard({ movie, onSelect }: MovieCardProps) {
  const showPoster = hasValidPoster(movie.Poster);

  function handleClick() {
    onSelect(movie.imdbID);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(movie.imdbID);
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`View details for ${movie.Title}`}
      className="group cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:focus-visible:ring-zinc-600"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton
            size="sm"
            movie={{
              imdbID: movie.imdbID,
              title: movie.Title,
              year: movie.Year,
              poster: movie.Poster,
            }}
          />
        </div>
        {showPoster ? (
          <Image
            src={movie.Poster}
            alt={`${movie.Title} poster`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-zinc-400">
            <svg
              className="h-10 w-10 opacity-60"
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
            <span className="text-xs font-medium uppercase tracking-wide">
              No poster
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
          {movie.Title}
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {movie.Year}
        </p>
      </div>
    </article>
  );
}
