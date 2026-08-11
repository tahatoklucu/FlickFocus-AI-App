"use client";

import MoviePoster from "@/components/MoviePoster";
import { POSTER_SIZES } from "@/lib/image-config";
import type { ChatMovieDetailsOutput } from "@/types/chat-tools";
import { ChatToolLifecycleShell } from "./ChatToolLifecycle";

function RatingBadge({
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
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ring-white/10 ${className}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
        {label}
      </span>
      <span>{value}</span>
    </span>
  );
}

interface ChatMovieDetailCardProps {
  output: ChatMovieDetailsOutput;
  onOpenDetails?: (imdbID: string) => void;
}

export default function ChatMovieDetailCard({
  output,
  onOpenDetails,
}: ChatMovieDetailCardProps) {
  const genres = output.genre?.split(",").map((g) => g.trim()).filter(Boolean) ?? [];

  return (
    <ChatToolLifecycleShell toolName="getMovieDetails" state="output-available">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative mx-auto aspect-[2/3] w-[140px] shrink-0 overflow-hidden rounded-xl bg-neutral-800 shadow-lg shadow-black/40 ring-1 ring-white/10 sm:mx-0">
          <MoviePoster
            poster={output.poster ?? "N/A"}
            title={output.title}
            year={output.year}
            sizes={POSTER_SIZES.chatDetail}
            variant="detail"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-bold leading-tight text-white sm:text-xl">
              {output.title}
            </h3>
            <p className="mt-1 text-sm text-neutral-400">
              {[output.year, output.rated, output.runtime].filter(Boolean).join(" · ")}
            </p>
          </div>

          {(output.imdbRating || output.rottenTomatoes || output.metascore) && (
            <div className="flex flex-wrap gap-2">
              {output.imdbRating ? (
                <RatingBadge
                  label="IMDb"
                  value={output.imdbRating.includes("/") ? output.imdbRating : `${output.imdbRating}/10`}
                  className="bg-amber-500/10 text-amber-300"
                />
              ) : null}
              {output.rottenTomatoes ? (
                <RatingBadge
                  label="RT"
                  value={output.rottenTomatoes}
                  className="bg-red-500/10 text-red-300"
                />
              ) : null}
              {output.metascore ? (
                <RatingBadge
                  label="Meta"
                  value={output.metascore}
                  className="bg-emerald-500/10 text-emerald-300"
                />
              ) : null}
            </div>
          )}

          {genres.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-neutral-700 bg-neutral-800/80 px-2.5 py-0.5 text-[11px] font-medium text-neutral-300"
                >
                  {genre}
                </span>
              ))}
            </div>
          ) : null}

          {output.plot ? (
            <p className="line-clamp-4 text-sm leading-relaxed text-neutral-300">
              {output.plot}
            </p>
          ) : null}

          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            {output.director ? (
              <div className="rounded-lg bg-neutral-900/70 px-3 py-2 ring-1 ring-neutral-800">
                <dt className="font-semibold uppercase tracking-wide text-neutral-500">Director</dt>
                <dd className="mt-1 text-neutral-200">{output.director}</dd>
              </div>
            ) : null}
            {output.actors ? (
              <div className="rounded-lg bg-neutral-900/70 px-3 py-2 ring-1 ring-neutral-800">
                <dt className="font-semibold uppercase tracking-wide text-neutral-500">Cast</dt>
                <dd className="mt-1 line-clamp-2 text-neutral-200">{output.actors}</dd>
              </div>
            ) : null}
          </dl>

          {onOpenDetails ? (
            <button
              type="button"
              onClick={() => onOpenDetails(output.imdbID)}
              className="rounded text-xs font-semibold text-violet-300 transition hover:text-violet-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            >
              Open full details →
            </button>
          ) : null}
        </div>
      </div>
    </ChatToolLifecycleShell>
  );
}
