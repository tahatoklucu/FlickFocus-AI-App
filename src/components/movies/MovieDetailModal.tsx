"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import FavoriteButton from "@/components/movies/FavoriteButton";
import MovieDetailView from "@/components/movies/MovieDetailView";
import MovieNotFound from "@/components/movies/MovieNotFound";
import Button from "@/components/ui/Button";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { getMovieById, getOMDbErrorMessage } from "@/services/omdb";
import { isMovieNotFoundMessage } from "@/services/omdb-core";
import type { Movie } from "@/types";

interface MovieDetailModalProps {
  imdbID: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function ModalToolbar({
  onClose,
  movie,
  showFavorite,
}: {
  onClose: () => void;
  movie?: Movie;
  showFavorite: boolean;
}) {
  return (
    <div className="absolute right-3 top-3 z-30 flex items-center gap-2 sm:right-4 sm:top-4">
      {showFavorite && movie && (
        <FavoriteButton
          movie={{
            imdbID: movie.imdbID,
            title: movie.Title,
            year: movie.Year,
            poster: movie.Poster,
          }}
          size="sm"
          className="bg-neutral-800/95 text-neutral-100 ring-1 ring-neutral-700 transition hover:scale-105 hover:bg-neutral-700"
        />
      )}
      <Button
        type="button"
        variant="icon"
        size="icon"
        onClick={onClose}
        className="border-neutral-700/90 bg-neutral-800/95 text-neutral-200 ring-1 ring-neutral-700 hover:text-white sm:h-9 sm:w-9"
        aria-label="Close movie details"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>
    </div>
  );
}

function FullPageLink({ imdbID }: { imdbID: string }) {
  return (
    <Link
      href={`/movie/${imdbID}`}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-300 underline-offset-4 transition hover:text-violet-200 hover:underline"
    >
      Open full page
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H19.5V12M19 6.5L11 14.5M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" />
      </svg>
    </Link>
  );
}

export default function MovieDetailModal({
  imdbID,
  isOpen,
  onClose,
}: MovieDetailModalProps) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isClient = useIsClient();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen);
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
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflowX = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.body.style.overflowX = "";
      document.documentElement.style.overflowX = "";
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

  if (!isOpen || !isClient) {
    return null;
  }

  const isMovieNotFound = error ? isMovieNotFoundMessage(error) : false;
  const showFavorite = Boolean(movie && !isLoading && !error);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-x-hidden p-0 sm:items-center sm:p-4 md:p-6"
      role="presentation"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-detail-title"
        aria-busy={isLoading}
        aria-describedby={isLoading ? "movie-detail-loading" : error ? "movie-detail-error" : undefined}
        className="relative z-10 flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden overscroll-x-none rounded-t-2xl border border-neutral-800 bg-neutral-950 shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <ModalToolbar onClose={handleClose} movie={movie ?? undefined} showFavorite={showFavorite} />

        {isLoading && (
          <div
            id="movie-detail-loading"
            role="status"
            aria-live="polite"
            className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 pb-16 pt-16"
          >
            <svg className="h-9 w-9 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm font-medium text-neutral-400">Loading movie details...</p>
          </div>
        )}

        {error && !isLoading && isMovieNotFound && (
          <div className="px-6 pb-10 pt-16 text-neutral-300">
            <MovieNotFound
              compact
              title="Movie not found"
              description="This title isn't in the OMDb catalog, or the ID may be invalid. Try searching for another movie."
              onSearchAgain={handleSearchAgain}
              onClose={handleClose}
            />
          </div>
        )}

        {error && !isLoading && !isMovieNotFound && (
          <div className="px-6 pb-16 pt-16 text-center">
            <p role="alert" className="text-sm font-medium text-red-400">
              {error}
            </p>
            <Button type="button" variant="secondary" onClick={handleClose} className="mt-5">
              Close
            </Button>
          </div>
        )}

        {movie && !isLoading && !error && (
          <div className="scrollbar-dark min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-x-none">
            <div className="px-4 pb-6 pt-14 md:px-8 md:pb-10 md:pt-16">
              <MovieDetailView
                movie={movie}
                titleId="movie-detail-title"
                actions={<FullPageLink imdbID={movie.imdbID} />}
              />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
