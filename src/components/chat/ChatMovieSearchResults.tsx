"use client";

import MoviePoster from "@/components/MoviePoster";
import type { ChatMovieSearchOutput } from "@/types/chat-tools";
import { ChatToolLifecycleShell } from "./ChatToolLifecycle";

interface ChatMovieSearchResultsProps {
  output: ChatMovieSearchOutput;
  onSelectMovie?: (imdbID: string) => void;
}

export default function ChatMovieSearchResults({
  output,
  onSelectMovie,
}: ChatMovieSearchResultsProps) {
  return (
    <ChatToolLifecycleShell toolName="searchMovies" state="output-available">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
            OMDb results
          </p>
          <p className="text-sm text-neutral-300">
            <span className="font-semibold text-white">&ldquo;{output.query}&rdquo;</span>
            {" · "}
            {output.results.length} shown
            {output.totalResults > output.results.length
              ? ` of ${output.totalResults}`
              : ""}
          </p>
        </div>
      </div>

      {output.results.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-6 text-center">
          <p className="text-sm font-medium text-neutral-300">No movies found</p>
          <p className="mt-1 text-xs text-neutral-500">
            Try a different title or spelling.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {output.results.map((movie) => (
            <li key={movie.imdbID}>
              <button
                type="button"
                onClick={() => onSelectMovie?.(movie.imdbID)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/70 text-left transition hover:border-violet-500/35 hover:shadow-lg hover:shadow-violet-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800">
                  <MoviePoster
                    poster={movie.poster}
                    title={movie.title}
                    year={movie.year}
                    sizes="120px"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-2.5">
                  <p className="line-clamp-2 text-xs font-semibold leading-snug text-neutral-50">
                    {movie.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">{movie.year}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </ChatToolLifecycleShell>
  );
}
