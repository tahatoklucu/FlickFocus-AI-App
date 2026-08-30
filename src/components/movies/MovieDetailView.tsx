"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import MovieTrailer from "@/components/movies/MovieTrailer";
import { hasValidPoster } from "@/components/movies/MoviePoster";
import { POSTER_QUALITY, POSTER_SIZES } from "@/lib/image-config";
import { cn } from "@/lib/cn";
import type { Movie } from "@/types";

export function displayValue(value: string | undefined): string | null {
  if (!value || value === "N/A") {
    return null;
  }
  return value;
}

export function getRating(movie: Movie, source: string): string | null {
  const rating = movie.Ratings?.find((entry) => entry.Source === source);
  return rating?.Value ?? null;
}

export function formatImdbRating(value: string): string {
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
      <span className="text-neutral-400" aria-hidden="true">
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
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm leading-relaxed text-neutral-200">{value}</p>
    </div>
  );
}

function GenreTags({ genres, className }: { genres: string[]; className?: string }) {
  if (genres.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
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
    <div className="relative w-full max-w-[11rem] md:max-w-[16.875rem]">
      {showImage && (
        <>
          <div
            className="pointer-events-none absolute -inset-6 opacity-30 blur-[48px] sm:-inset-10 sm:blur-[72px]"
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
              fetchPriority="low"
              decoding="async"
            />
          </div>
          <div
            className="pointer-events-none absolute -inset-3 opacity-50 blur-xl sm:-inset-4 sm:blur-2xl"
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
              fetchPriority="low"
              decoding="async"
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
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="object-cover object-center"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 px-4 text-center">
            <p className="line-clamp-4 text-base font-semibold leading-snug text-white sm:text-lg">
              {title}
            </p>
            {year && (
              <p className="mt-2 text-xs font-medium uppercase tracking-widest text-neutral-400">
                {year}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface MovieDetailViewProps {
  movie: Movie;
  /** Rendered as an h2 inside the modal dialog, h1 on the standalone page. */
  headingLevel?: "h1" | "h2";
  titleId?: string;
  /** Slot for context-specific actions, e.g. a link to the full page. */
  actions?: ReactNode;
}

/**
 * Shared movie presentation used by both the quick-look modal and the
 * standalone `/movie/[imdbId]` page, so the two never drift apart.
 */
export default function MovieDetailView({
  movie,
  headingLevel = "h2",
  titleId,
  actions,
}: MovieDetailViewProps) {
  const Heading = headingLevel;

  const imdbRating =
    getRating(movie, "Internet Movie Database") ?? displayValue(movie.imdbRating);
  const rottenTomatoesRating = getRating(movie, "Rotten Tomatoes");
  const metascore = displayValue(movie.Metascore);
  const year = displayValue(movie.Year);
  const runtime = displayValue(movie.Runtime);
  const rated = displayValue(movie.Rated);
  const plot = displayValue(movie.Plot);
  const genres = splitList(displayValue(movie.Genre));

  return (
    <div className="grid grid-cols-1 items-start gap-6 max-md:justify-items-center md:grid-cols-[minmax(12rem,16.875rem)_minmax(0,1fr)] md:gap-10">
      <aside className="w-full max-w-[11rem] md:max-w-none">
        <PosterShowcase poster={movie.Poster} title={movie.Title} year={movie.Year} />
      </aside>

      <div className="min-w-0 w-full space-y-4 max-md:text-center md:space-y-6 md:text-left">
        <header className="space-y-3 md:space-y-4">
          <div>
            <Heading
              id={titleId}
              className="break-words text-2xl font-extrabold leading-tight tracking-tight text-white md:text-3xl lg:text-4xl"
            >
              {movie.Title}
            </Heading>
            {rated && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                {rated}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-start">
            {year && <MetaItem icon={<CalendarIcon className="h-4 w-4" />} label="Year" value={year} />}
            {runtime && <MetaItem icon={<ClockIcon className="h-4 w-4" />} label="Runtime" value={runtime} />}
          </div>

          {(imdbRating || rottenTomatoesRating || metascore) && (
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
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

          <GenreTags genres={genres} className="max-md:justify-center md:justify-start" />

          {actions}
        </header>

        <MovieTrailer imdbID={movie.imdbID} title={movie.Title} className="text-left" />

        {plot && (
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Synopsis
            </h3>
            <p className="break-words text-base leading-7 text-neutral-300 md:text-[17px] md:leading-8">
              {plot}
            </p>
          </section>
        )}

        <div className="grid gap-2.5 md:grid-cols-2 md:gap-3">
          <InfoCard label="Director" value={displayValue(movie.Director)} />
          <InfoCard label="Cast" value={displayValue(movie.Actors)} />
          <InfoCard label="Released" value={displayValue(movie.Released)} />
          <InfoCard label="Language" value={displayValue(movie.Language)} />
        </div>
      </div>
    </div>
  );
}
