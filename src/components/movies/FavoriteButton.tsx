"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { buttonClass } from "@/lib/button-styles";
import { cn } from "@/lib/cn";
import type { AddFavoritePayload } from "@/types";

interface FavoriteButtonProps {
  movie: AddFavoritePayload;
  size?: "sm" | "md";
  className?: string;
}

export default function FavoriteButton({
  movie,
  size = "md",
  className = "",
}: FavoriteButtonProps) {
  const { user, openAuthModal } = useAuth();
  const { isFavorite, toggleFavorite, error: favoritesError } = useFavorites();
  const [localError, setLocalError] = useState<string | null>(null);

  const favorited = isFavorite(movie.imdbID);
  const sizeClasses = size === "sm" ? "h-9 w-9 sm:h-10 sm:w-10" : "h-11 w-11";
  const iconClasses = size === "sm" ? "h-4 w-4 sm:h-5 sm:w-5" : "h-5 w-5";
  const displayedError = localError ?? favoritesError;

  useEffect(() => {
    if (!displayedError) {
      return;
    }

    const timeoutId = window.setTimeout(() => setLocalError(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [displayedError]);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    event.preventDefault();

    if (!user) {
      openAuthModal("signin");
      return;
    }

    setLocalError(null);
    toggleFavorite(movie);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={favorited}
        title={displayedError ?? undefined}
        className={buttonClass("favorite", "icon", cn(sizeClasses, className))}
      >
        <svg
          className={`${iconClasses} transition ${favorited ? "fill-red-500 text-red-500" : "fill-none"}`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={favorited ? 0 : 2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
          />
        </svg>
      </button>

      {displayedError && (
        <p
          role="alert"
          className="absolute right-0 top-full z-20 mt-1 w-44 max-w-[min(11rem,calc(100vw-2rem))] break-words rounded-lg bg-red-950/90 px-2 py-1 text-[10px] leading-snug text-red-100"
        >
          {displayedError}
        </p>
      )}
    </div>
  );
}
