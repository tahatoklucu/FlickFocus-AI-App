"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { FavoritesError } from "@/services/favorites";
import { getUnknownErrorMessage } from "@/lib/errors";
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
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const favorited = isFavorite(movie.imdbID);
  const sizeClasses = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconClasses = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  useEffect(() => {
    if (!error) {
      return;
    }

    const timeoutId = window.setTimeout(() => setError(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    event.preventDefault();

    if (!user) {
      openAuthModal("signin");
      return;
    }

    setIsToggling(true);
    setError(null);

    try {
      await toggleFavorite(movie);
    } catch (err) {
      setError(
        err instanceof FavoritesError
          ? err.message
          : getUnknownErrorMessage(err, "Failed to update favorite."),
      );
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={isToggling}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={favorited}
        title={error ?? undefined}
        className={`inline-flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 ${sizeClasses} ${className}`}
      >
        <svg
          className={`${iconClasses} ${favorited ? "fill-red-500 text-red-500" : "fill-none"}`}
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

      {error && (
        <p
          role="alert"
          className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg bg-red-950/90 px-2 py-1 text-[10px] leading-snug text-red-100"
        >
          {error}
        </p>
      )}
    </div>
  );
}
