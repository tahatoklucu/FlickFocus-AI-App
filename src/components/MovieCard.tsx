"use client";

import { memo, useCallback, type KeyboardEvent } from "react";
import FavoriteButton from "@/components/FavoriteButton";
import MoviePoster from "@/components/MoviePoster";
import { cn } from "@/lib/cn";
import type { MovieSearchResult } from "@/types";

interface MovieCardProps {
  movie: MovieSearchResult;
  onSelect: (imdbID: string) => void;
  priority?: boolean;
  className?: string;
}

function MovieCard({ movie, onSelect, priority = false, className }: MovieCardProps) {
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
      className={cn(
        "group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-neutral-800/90 bg-neutral-900/50 shadow-sm shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-950/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
        className,
      )}
    >
      <div className="relative aspect-[2/3] w-full shrink-0 overflow-hidden bg-neutral-800">
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
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-50">
          {movie.Title}
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          {movie.Year}
        </p>
        <div className="flex-1" aria-hidden="true" />
      </div>
    </article>
  );
}

export default memo(MovieCard);
