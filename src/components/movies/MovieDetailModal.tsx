"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import FavoriteButton from "@/components/movies/FavoriteButton";
import MovieNotFound from "@/components/movies/MovieNotFound";
import Button from "@/components/ui/Button";
import { hasValidPoster } from "@/components/movies/MoviePoster";
import { POSTER_QUALITY, POSTER_SIZES } from "@/lib/image-config";
import { useFocusTrap } from "@/hooks/useFocusTrap";
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

function formatImdbRating(value: string): string {
  return value.includes("/") ? value : `${value}/10`;
}

function splitList(value: string | null): string[] {
  if (!value) {
    return [];
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function StarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
    </svg>
  );
}

function CalendarIcon({ className = "h-4 w-4" }: { className?: string }) {
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
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-neutral-300">
      <span className="text-neutral-500" aria-hidden="true">
        {icon}
      </span>
      <span className="sr-only">{label}: </span>
      <span className="min-w-0 break-words font-medium">{value}</span>
    </span>
  );
}

function RatingPill({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold ring-1 ring-inset ring-white/10 ${className}`}
    >
      <StarIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">{label}</span>
      <span>{value}</span>
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div className="rounded-lg bg-neutral-900/70 px-4 py-3 ring-1 ring-neutral-800">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm leading-relaxed text-neutral-200">{value}</p>
    </div>
  );
}

function GenreTags({ genres }: { genres: string[] }) {
  if (genres.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => (
        <span
          key={genre}
          className="rounded-full bg-neutral-800/80 px-3 py-1 text-xs font-medium text-neutral-300 ring-1 ring-neutral-700/80"
        >
          {genre}
        </span>
      ))}
    </div>
  );
}

function PosterShowcase({
  poster,
  title,
  year,
}: {
  poster: string;
  title: string;
  year?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const showImage = hasValidPoster(poster) && !hasError;

  return (
    <div className="relative mx-auto w-[270px] shrink-0 sm:mx-0">
      {showImage && (
        <>
          <div
            className="pointer-events-none absolute -inset-10 -z-10 opacity-30 blur-[72px]"
            aria-hidden="true"
          >
            <Image
              src={poster}
              alt=""
              fill
              sizes={POSTER_SIZES.modal}
              quality={POSTER_QUALITY.decorative}
              className="scale-125 object-cover"
              loading="lazy"
            />
          </div>
          <div
            className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] opacity-50 blur-2xl"
            aria-hidden="true"
          >
            <Image
              src={poster}
              alt=""
              fill
              sizes={POSTER_SIZES.modal}
              quality={POSTER_QUALITY.decorative}
              className="object-cover"
              loading="lazy"
            />
          </div>
        </>
      )}

      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl shadow-2xl shadow-black/80 ring-1 ring-white/10">
        {showImage ? (
          <Image
            src={poster}
            alt={`${title} poster`}
            fill
            sizes={POSTER_SIZES.modal}
            quality={POSTER_QUALITY.detail}
            priority
            className="object-cover object-center"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 px-4 text-center">
            <p className="line-clamp-4 text-base font-semibold leading-snug text-white sm:text-lg">
              {title}
            </p>
            {year && (
              <p className="mt-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
                {year}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
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

export default function MovieDetailModal({
  imdbID,
  isOpen,
  onClose,
}: MovieDetailModalProps) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  if (!isOpen) {
    return null;
  }

  const imdbRating = movie
    ? (getRating(movie, "Internet Movie Database") ?? displayValue(movie.imdbRating))
    : null;
  const rottenTomatoesRating = movie ? getRating(movie, "Rotten Tomatoes") : null;
  const metascore = movie ? displayValue(movie.Metascore) : null;
  const isMovieNotFound = error ? isMovieNotFoundMessage(error) : false;
  const year = movie ? displayValue(movie.Year) : null;
  const runtime = movie ? displayValue(movie.Runtime) : null;
  const rated = movie ? displayValue(movie.Rated) : null;
  const plot = movie ? displayValue(movie.Plot) : null;
  const genres = splitList(displayValue(movie?.Genre));
  const showFavorite = Boolean(movie && !isLoading && !error);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden p-0 sm:items-center sm:p-6"
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
            <div className="flex min-w-0 flex-col gap-8 px-5 pb-8 pt-14 sm:flex-row sm:gap-12 sm:px-8 sm:pb-10 sm:pt-16">
              <PosterShowcase
                poster={movie.Poster}
                title={movie.Title}
                year={movie.Year}
              />

              <div className="min-w-0 flex-1 space-y-6">
                <header className="space-y-4">
                  <div>
                    <h2
                      id="movie-detail-title"
                      className="break-words text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl"
                    >
                      {movie.Title}
                    </h2>
                    {rated && (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                        {rated}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    {year && <MetaItem icon={<CalendarIcon className="h-4 w-4" />} label="Year" value={year} />}
                    {runtime && <MetaItem icon={<ClockIcon className="h-4 w-4" />} label="Runtime" value={runtime} />}
                  </div>

                  {(imdbRating || rottenTomatoesRating || metascore) && (
                    <div className="flex flex-wrap gap-2">
                      {imdbRating && (
                        <RatingPill
                          label="IMDb"
                          value={formatImdbRating(imdbRating)}
                          className="bg-amber-500/10 text-amber-300"
                        />
                      )}
                      {rottenTomatoesRating && (
                        <RatingPill
                          label="RT"
                          value={rottenTomatoesRating}
                          className="bg-red-500/10 text-red-300"
                        />
                      )}
                      {metascore && (
                        <RatingPill
                          label="Meta"
                          value={metascore}
                          className="bg-emerald-500/10 text-emerald-300"
                        />
                      )}
                    </div>
                  )}

                  <GenreTags genres={genres} />
                </header>

                {plot && (
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Synopsis
                    </h3>
                    <p className="break-words text-base leading-7 text-neutral-300 sm:text-[17px] sm:leading-8">
                      {plot}
                    </p>
                  </section>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCard label="Director" value={displayValue(movie.Director)} />
                  <InfoCard label="Cast" value={displayValue(movie.Actors)} />
                  <InfoCard label="Released" value={displayValue(movie.Released)} />
                  <InfoCard label="Language" value={displayValue(movie.Language)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
