"use client";

import { useState, type MouseEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
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

  const favorited = isFavorite(movie.imdbID);
  const sizeClasses = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconClasses = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    event.preventDefault();

    if (!user) {
      openAuthModal("signin");
      return;
    }

    setIsToggling(true);

    try {
      await toggleFavorite(movie);
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isToggling}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
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
  );
}
