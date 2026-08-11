"use client";

import { memo, useCallback } from "react";
import FavoriteButton from "@/components/movies/FavoriteButton";
import MoviePoster from "@/components/movies/MoviePoster";
import { cn } from "@/lib/cn";
import { POSTER_SIZES } from "@/lib/image-config";
import type { MovieSearchResult } from "@/types";

interface MovieCardProps {
  movie: MovieSearchResult;
  onSelect: (imdbID: string) => void;
  priority?: boolean;
  className?: string;
}

function MovieCard({ movie, onSelect, priority = false, className }: MovieCardProps) {
  const handleOpenDetails = useCallback(() => {
    onSelect(movie.imdbID);
  }, [movie.imdbID, onSelect]);

  return (
    <article
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-neutral-800/90 bg-neutral-900/50 shadow-sm shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-950/20",
        className,
      )}
    >
      <button
        type="button"
        onClick={handleOpenDetails}
        aria-label={`View details for ${movie.Title}`}
        className="flex min-h-0 flex-1 flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500/50"
      >
        <div className="relative aspect-[2/3] w-full shrink-0 overflow-hidden bg-neutral-800">
          <MoviePoster
            key={`${movie.imdbID}-${movie.Poster}`}
            poster={movie.Poster}
            title={movie.Title}
            year={movie.Year}
            priority={priority}
            sizes={POSTER_SIZES.card}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-50">
            {movie.Title}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">{movie.Year}</p>
          <div className="flex-1" aria-hidden="true" />
        </div>
      </button>

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
    </article>
  );
}

export default memo(MovieCard);
