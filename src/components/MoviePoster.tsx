"use client";

import { memo, useEffect, useState } from "react";
import Image from "next/image";
import { checkPosterAvailability } from "@/lib/poster-availability.client";
import { POSTER_QUALITY } from "@/lib/image-config";
import { isValidPosterUrl } from "@/lib/poster-url";

export function hasValidPoster(poster: string): boolean {
  return isValidPosterUrl(poster);
}

type PosterStatus = "checking" | "available" | "unavailable";

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

function PosterPlaceholder({
  title,
  year,
  variant,
}: {
  title: string;
  year?: string;
  variant: "card" | "detail";
}) {
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
      {year ? (
        <p className="relative z-10 mt-2 text-xs font-medium uppercase tracking-widest text-zinc-400">
          {year}
        </p>
      ) : null}
    </div>
  );
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
  const [status, setStatus] = useState<PosterStatus>("checking");
  const isPosterUrlValid = hasValidPoster(poster);

  const resolvedQuality =
    quality ?? (variant === "detail" ? POSTER_QUALITY.detail : POSTER_QUALITY.card);

  useEffect(() => {
    if (!isPosterUrlValid) {
      return;
    }

    let cancelled = false;

    checkPosterAvailability(poster).then((available) => {
      if (!cancelled) {
        setStatus(available ? "available" : "unavailable");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [poster, isPosterUrlValid]);

  if (!isPosterUrlValid || status === "unavailable") {
    return <PosterPlaceholder title={title} year={year} variant={variant} />;
  }

  if (status === "checking") {
    return (
      <div
        className="absolute inset-0 animate-pulse bg-neutral-800"
        aria-hidden="true"
      />
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
      onError={() => setStatus("unavailable")}
    />
  );
}

export default memo(MoviePoster);
