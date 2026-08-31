"use client";

import { memo, useCallback, useMemo } from "react";
import FavoriteButton from "@/components/movies/FavoriteButton";
import MoviePoster from "@/components/movies/MoviePoster";
import WatchlistButton from "@/components/movies/WatchlistButton";
import { useFavorites } from "@/context/favorites-context.shared";
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

  const libraryPayload = useMemo(
    () => ({
      imdbID: movie.imdbID,
      title: movie.Title,
      year: movie.Year,
      poster: movie.Poster,
    }),
    [movie.imdbID, movie.Title, movie.Year, movie.Poster],
  );

  const { getEntry } = useFavorites();
  const entry = getEntry(movie.imdbID);

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
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-neutral-400">{movie.Year}</p>
            {entry?.rating ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-xs font-semibold text-amber-300">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="sr-only">Your rating: </span>
                {entry.rating}
              </span>
            ) : null}
          </div>
          <div className="flex-1" aria-hidden="true" />
        </div>
      </button>

      <div className="absolute right-2 top-2 z-10 flex flex-col gap-2">
        <FavoriteButton size="sm" movie={libraryPayload} />
        <WatchlistButton size="sm" movie={libraryPayload} />
      </div>
    </article>
  );
}

export default memo(MovieCard);
