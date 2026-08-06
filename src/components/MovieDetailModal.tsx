"use client";

import { useCallback, useEffect, useState } from "react";
import FavoriteButton from "@/components/FavoriteButton";
import MovieNotFound from "@/components/MovieNotFound";
import MoviePoster from "@/components/MoviePoster";
import { getMovieById, getOMDbErrorMessage } from "@/services/omdb";
import { isMovieNotFoundMessage } from "@/services/omdb-core";
import type { Movie } from "@/types";

interface MovieDetailModalProps {
  imdbID: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function displayValue(value: string | undefined): string | null {
  if (!value || value === "N/A") {
    return null;
  }
  return value;
}

function getRating(movie: Movie, source: string): string | null {
  const rating = movie.Ratings?.find((entry) => entry.Source === source);
  return rating?.Value ?? null;
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">{value}</dd>
    </div>
  );
}

export default function MovieDetailModal({
  imdbID,
  isOpen,
  onClose,
}: MovieDetailModalProps) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSearchAgain = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen || !imdbID) {
      return;
    }

    let cancelled = false;

    async function fetchMovieDetails() {
      setIsLoading(true);
      setError(null);
      setMovie(null);

      try {
        const data = await getMovieById(imdbID!);
        if (!cancelled) {
          setMovie(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getOMDbErrorMessage(err, "Failed to load movie details."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchMovieDetails();

    return () => {
      cancelled = true;
    };
  }, [isOpen, imdbID]);

  if (!isOpen) {
    return null;
  }

  const imdbRating = movie
    ? (getRating(movie, "Internet Movie Database") ??
      displayValue(movie.imdbRating))
    : null;
  const rottenTomatoesRating = movie
    ? getRating(movie, "Rotten Tomatoes")
    : null;
  const metascore = movie ? displayValue(movie.Metascore) : null;
  const isMovieNotFound = error ? isMovieNotFoundMessage(error) : false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={handleClose}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-detail-title"
        aria-busy={isLoading}
        className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70 dark:bg-zinc-800/80 dark:hover:bg-zinc-700"
          aria-label="Close movie details"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-zinc-500 dark:text-zinc-400">
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
            <p className="text-sm font-medium">Loading movie details...</p>
          </div>
        )}

        {error && !isLoading && isMovieNotFound && (
          <MovieNotFound
            compact
            title="Movie not found"
            description="This title isn't in the OMDb catalog, or the ID may be invalid. Try searching for another movie."
            onSearchAgain={handleSearchAgain}
            onClose={handleClose}
          />
        )}

        {error && !isLoading && !isMovieNotFound && (
          <div className="px-6 py-24 text-center">
            <p
              role="alert"
              className="text-sm font-medium text-red-600 dark:text-red-400"
            >
              {error}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Close
            </button>
          </div>
        )}

        {movie && !isLoading && !error && (
          <div className="overflow-y-auto">
            <div className="grid gap-0 sm:grid-cols-[280px_1fr] md:grid-cols-[320px_1fr]">
              <div className="relative aspect-[2/3] overflow-hidden bg-zinc-100 sm:aspect-auto sm:min-h-full dark:bg-zinc-800">
                <MoviePoster
                  poster={movie.Poster}
                  title={movie.Title}
                  year={movie.Year}
                  sizes="(max-width: 640px) 100vw, 320px"
                  priority
                  variant="detail"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col gap-6 p-6 sm:p-8">
                <header className="flex items-start justify-between gap-4">
                  <div>
                    <h2
                      id="movie-detail-title"
                      className="pr-2 text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl"
                    >
                      {movie.Title}
                    </h2>
                    <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                      {[displayValue(movie.Year), displayValue(movie.Rated)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <FavoriteButton
                    movie={{
                      imdbID: movie.imdbID,
                      title: movie.Title,
                      year: movie.Year,
                      poster: movie.Poster,
                    }}
                  />
                </header>

                {(imdbRating || rottenTomatoesRating || metascore) && (
                  <div className="flex flex-wrap gap-3">
                    {imdbRating && (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
                        IMDb {imdbRating}
                        {imdbRating.includes("/") ? "" : "/10"}
                      </span>
                    )}
                    {rottenTomatoesRating && (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
                        RT {rottenTomatoesRating}
                      </span>
                    )}
                    {metascore && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/40 dark:text-green-200">
                        Metascore {metascore}
                      </span>
                    )}
                  </div>
                )}

                {displayValue(movie.Plot) && (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Plot
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {movie.Plot}
                    </p>
                  </section>
                )}

                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Genre" value={displayValue(movie.Genre)} />
                  <DetailRow
                    label="Runtime"
                    value={displayValue(movie.Runtime)}
                  />
                  <DetailRow
                    label="Director"
                    value={displayValue(movie.Director)}
                  />
                  <DetailRow label="Actors" value={displayValue(movie.Actors)} />
                  <DetailRow
                    label="Released"
                    value={displayValue(movie.Released)}
                  />
                  <DetailRow
                    label="Language"
                    value={displayValue(movie.Language)}
                  />
                </dl>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
