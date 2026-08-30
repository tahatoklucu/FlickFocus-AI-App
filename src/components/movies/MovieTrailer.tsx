"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { getTrailersByImdbId } from "@/services/trailers.client";
import type { MovieTrailer as MovieTrailerData } from "@/types";

interface MovieTrailerProps {
  imdbID: string;
  title: string;
  className?: string;
}

function PlayIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 001.53.85l10.79-6.86a1 1 0 000-1.7L9.53 4.29A1 1 0 008 5.14z" />
    </svg>
  );
}

export default function MovieTrailer({ imdbID, title, className }: MovieTrailerProps) {
  const [trailers, setTrailers] = useState<MovieTrailerData[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTrailers() {
      setIsLoading(true);
      setTrailers([]);
      setActiveKey(null);
      setIsPlaying(false);

      try {
        const results = await getTrailersByImdbId(imdbID);
        if (!cancelled) {
          setTrailers(results);
          setActiveKey(results[0]?.youtubeKey ?? null);
        }
      } catch {
        if (!cancelled) {
          setTrailers([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadTrailers();

    return () => {
      cancelled = true;
    };
  }, [imdbID]);

  if (isLoading) {
    return (
      <section className={className} aria-busy="true">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Trailer
        </h3>
        <div className="aspect-video w-full animate-pulse rounded-xl bg-neutral-900 ring-1 ring-neutral-800" />
      </section>
    );
  }

  if (trailers.length === 0 || !activeKey) {
    return null;
  }

  const activeTrailer = trailers.find((trailer) => trailer.youtubeKey === activeKey) ?? trailers[0];

  return (
    <section className={className}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
        Trailer
      </h3>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-neutral-800">
        {isPlaying ? (
          <iframe
            key={activeKey}
            src={`https://www.youtube-nocookie.com/embed/${activeKey}?autoplay=1&rel=0&modestbranding=1`}
            title={`${title} trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="group absolute inset-0 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label={`Play ${title} trailer`}
          >
            <Image
              src={`https://i.ytimg.com/vi/${activeKey}/hqdefault.jpg`}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              quality={70}
              loading="lazy"
              decoding="async"
              className="object-cover transition duration-300 group-hover:scale-[1.03] group-hover:opacity-90"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-600/95 text-white shadow-lg shadow-black/50 transition group-hover:scale-110">
              <PlayIcon className="ml-1 h-7 w-7" />
            </span>
            <span className="absolute bottom-3 left-4 right-4 truncate text-left text-sm font-medium text-white/90">
              {activeTrailer.name}
            </span>
          </button>
        )}
      </div>

      {trailers.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2 max-md:justify-center">
          {trailers.map((trailer) => (
            <button
              key={trailer.youtubeKey}
              type="button"
              onClick={() => {
                setActiveKey(trailer.youtubeKey);
                setIsPlaying(true);
              }}
              className={cn(
                "max-w-full truncate rounded-full px-3 py-1 text-xs font-medium ring-1 transition",
                trailer.youtubeKey === activeKey
                  ? "bg-white/10 text-white ring-white/30"
                  : "bg-neutral-800/80 text-neutral-300 ring-neutral-700/80 hover:bg-neutral-700/80 hover:text-white",
              )}
              aria-pressed={trailer.youtubeKey === activeKey}
            >
              {trailer.name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
