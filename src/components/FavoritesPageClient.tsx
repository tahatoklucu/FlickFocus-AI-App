"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import MovieList from "@/components/MovieList";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import type { MovieSearchResult, UserFavorite } from "@/types";

const MovieDetailModal = dynamic(
  () => import("@/components/MovieDetailModal"),
  { ssr: false },
);

function toMovieSearchResult(favorite: UserFavorite): MovieSearchResult {
  return {
    Title: favorite.title,
    Year: favorite.year,
    imdbID: favorite.imdbID,
    Type: "movie",
    Poster: favorite.poster,
  };
}

export default function FavoritesPageClient() {
  const { user, loading: authLoading, isConfigured, openAuthModal } = useAuth();
  const {
    favorites,
    loading: favoritesLoading,
    error: favoritesError,
    clearError,
  } = useFavorites();
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const movies = useMemo(
    () => favorites.map(toMovieSearchResult),
    [favorites],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedMovieId(null);
  }, []);

  const handleMovieSelect = useCallback((imdbID: string) => {
    setSelectedMovieId(imdbID);
    setIsModalOpen(true);
  }, []);

  const isAuthPending = authLoading;
  const isFavoritesPending = Boolean(user) && favoritesLoading;

  const resultLabel = useMemo(
    () => `${movies.length} saved movie${movies.length === 1 ? "" : "s"}`,
    [movies.length],
  );

  if (!isConfigured) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Firebase is not configured yet.
        </p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Add your Firebase environment variables to enable favorites.
        </p>
      </div>
    );
  }

  if (isAuthPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-500 dark:text-zinc-400">
        <svg
          className="h-8 w-8 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-sm font-medium">Checking your account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <svg
          className="h-12 w-12 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Sign in to view your favorites
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Create an account or sign in to save and access your watchlist.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAuthModal("signin")}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <>
      <section>
        <MovieList
          movies={movies}
          isLoading={isFavoritesPending}
          error={favoritesError}
          hasSearched
          onMovieSelect={handleMovieSelect}
          showInitialPrompt={false}
          loadingMessage="Loading your favorites..."
          emptyTitle="No favorites yet"
          emptySubtitle="Search for movies and tap the heart icon to save them here."
          resultLabel={resultLabel}
        />

        {favoritesError && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={clearError}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Dismiss error
            </button>
          </div>
        )}

        {!isFavoritesPending && !favoritesError && movies.length === 0 && (
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Browse Movies
            </Link>
          </div>
        )}
      </section>

      <MovieDetailModal
        imdbID={selectedMovieId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
