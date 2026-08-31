"use client";

import type { MouseEvent } from "react";
import { useAuth } from "@/context/auth-context.shared";
import { useFavorites } from "@/context/favorites-context.shared";
import { buttonClass } from "@/lib/button-styles";
import { cn } from "@/lib/cn";
import type { AddFavoritePayload } from "@/types";

interface WatchlistButtonProps {
  movie: AddFavoritePayload;
  size?: "sm" | "md";
  className?: string;
}

/** Quick "watch later" toggle for movie cards, mirroring FavoriteButton. */
export default function WatchlistButton({
  movie,
  size = "md",
  className = "",
}: WatchlistButtonProps) {
  const { user, openAuthModal } = useAuth();
  const { isInWatchlist, isWatched, toggleWatchlist } = useFavorites();

  const queued = isInWatchlist(movie.imdbID);
  const watched = isWatched(movie.imdbID);
  const sizeClasses = size === "sm" ? "h-9 w-9 sm:h-10 sm:w-10" : "h-11 w-11";
  const iconClasses = size === "sm" ? "h-4 w-4 sm:h-5 sm:w-5" : "h-5 w-5";

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    event.preventDefault();

    if (!user) {
      openAuthModal("signin");
      return;
    }

    toggleWatchlist(movie);
  }

  const label = queued
    ? "Remove from watchlist"
    : watched
      ? "Watched — add to watchlist again"
      : "Add to watchlist";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      aria-pressed={queued}
      title={label}
      className={buttonClass("favorite", "icon", cn(sizeClasses, className))}
    >
      {watched && !queued ? (
        <svg
          className={cn(iconClasses, "text-emerald-400")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg
          className={cn(
            iconClasses,
            "transition",
            queued ? "fill-violet-400 text-violet-400" : "fill-none",
          )}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={queued ? 0 : 2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 3.75h12A1.75 1.75 0 0119.75 5.5v15.02L12 15.1l-7.75 5.42V5.5A1.75 1.75 0 016 3.75z"
          />
        </svg>
      )}
    </button>
  );
}
