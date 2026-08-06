"use client";

import { memo, useCallback, type KeyboardEvent } from "react";
import FavoriteButton from "@/components/FavoriteButton";
import MoviePoster from "@/components/MoviePoster";
import type { MovieSearchResult } from "@/types";

interface MovieCardProps {
  movie: MovieSearchResult;
  onSelect: (imdbID: string) => void;
  priority?: boolean;
}

function MovieCard({ movie, onSelect, priority = false }: MovieCardProps) {
  const handleClick = useCallback(() => {
    onSelect(movie.imdbID);
  }, [movie.imdbID, onSelect]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(movie.imdbID);
      }
    },
    [movie.imdbID, onSelect],
  );

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
        <MoviePoster
          poster={movie.Poster}
          title={movie.Title}
          year={movie.Year}
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
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

export default memo(MovieCard);
