"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { POSTER_QUALITY } from "@/lib/image-config";

export function hasValidPoster(poster: string): boolean {
  return poster !== "N/A" && poster.trim().length > 0;
}

interface MoviePosterProps {
  poster: string;
  title: string;
  year?: string;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  className?: string;
  variant?: "card" | "detail";
}

function MoviePoster({
  poster,
  title,
  year,
  sizes = "100vw",
  quality,
  priority = false,
  className = "object-cover",
  variant = "card",
}: MoviePosterProps) {
  const [hasError, setHasError] = useState(false);
  const showImage = hasValidPoster(poster) && !hasError;
  const resolvedQuality =
    quality ?? (variant === "detail" ? POSTER_QUALITY.detail : POSTER_QUALITY.card);

  if (!showImage) {
    return (
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950 px-4 text-center dark:from-zinc-800 dark:via-zinc-900 dark:to-black ${variant === "detail" ? "min-h-[320px]" : ""}`}
        aria-label={`${title} poster unavailable`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
        <p
          className={`relative z-10 line-clamp-4 font-semibold leading-snug text-white ${
            variant === "detail" ? "text-lg sm:text-2xl" : "text-sm sm:text-base"
          }`}
        >
          {title}
        </p>
        {year && (
          <p className="relative z-10 mt-2 text-xs font-medium uppercase tracking-widest text-zinc-400">
            {year}
          </p>
        )}
      </div>
    );
  }

  return (
    <Image
      src={poster}
      alt={`${title} poster`}
      fill
      sizes={sizes}
      quality={resolvedQuality}
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

export default memo(MoviePoster);
