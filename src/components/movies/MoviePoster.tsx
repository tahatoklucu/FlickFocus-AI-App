"use client";

import { memo, useEffect, useState } from "react";
import Image from "next/image";
import { checkPosterAvailability } from "@/lib/poster/poster-availability.client";
import { POSTER_QUALITY } from "@/lib/image-config";
import { isValidPosterUrl } from "@/lib/poster/poster-url";
import { scheduleIdleTask } from "@/lib/schedule-idle";

export function hasValidPoster(poster: string): boolean {
  return isValidPosterUrl(poster);
}

interface MoviePosterProps {
  poster: string;
  title: string;
  year?: string;
  sizes?: string;
  quality?: number;
  /** Above-the-fold LCP candidate — eager + fetchPriority high. */
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
  const [failedPoster, setFailedPoster] = useState<string | null>(null);
  const isPosterUrlValid = hasValidPoster(poster);
  const unavailable = failedPoster === poster;

  const resolvedQuality =
    quality ?? (variant === "detail" ? POSTER_QUALITY.detail : POSTER_QUALITY.card);

  useEffect(() => {
    if (!isPosterUrlValid || priority) {
      // Priority/LCP posters must not wait on an availability round-trip.
      return;
    }

    let cancelled = false;

    // The probe is a safety net for OMDb URLs that resolve to nothing, not
    // something the first paint depends on, so keep it off the load path. A
    // genuinely broken image still falls back through onError meanwhile.
    const cancelProbe = scheduleIdleTask(() => {
      checkPosterAvailability(poster).then((available) => {
        if (!cancelled && !available) {
          setFailedPoster(poster);
        }
      });
    }, { afterLoad: true, timeout: 5_000 });

    return () => {
      cancelled = true;
      cancelProbe();
    };
  }, [poster, isPosterUrlValid, priority]);

  if (!isPosterUrlValid || unavailable) {
    return <PosterPlaceholder title={title} year={year} variant={variant} />;
  }

  return (
    <Image
      src={poster}
      alt={`${title} poster`}
      fill
      sizes={sizes}
      quality={resolvedQuality}
      priority={priority}
      fetchPriority={priority ? "high" : "low"}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
      onError={() => setFailedPoster(poster)}
    />
  );
}

export default memo(MoviePoster);
