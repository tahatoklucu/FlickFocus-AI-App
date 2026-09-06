"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import MovieList from "@/components/movies/MovieList";
import Button from "@/components/ui/Button";
import { buttonClass } from "@/lib/button-styles";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useLibraryShelf } from "@/hooks/useLibraryShelf";
import {
  browseLibraryEntries,
  LIBRARY_SORT_OPTIONS,
  pickRandomLibraryEntry,
  type LibrarySort,
} from "@/lib/library-browse";
import { LIBRARY_TABS } from "@/lib/library-tabs";
import type { LibraryShelf, MovieSearchResult, UserFavorite } from "@/types";

const MovieDetailModal = dynamic(
  () => import("@/components/movies/MovieDetailModal"),
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

const EMPTY_STATES: Record<LibraryShelf, { title: string; subtitle: string }> = {
  favorite: {
    title: "No favorites yet",
    subtitle: "Tap the heart on any movie to keep it here.",
  },
  watchlist: {
    title: "Your watchlist is empty",
    subtitle: "Tap the bookmark on any movie to line it up for later.",
  },
  watched: {
    title: "Nothing marked watched yet",
    subtitle: "Open a movie and mark it watched to build your history.",
  },
};

function LibraryBrowseToolbar({
  query,
  sort,
  shelf,
  canSurprise,
  onQueryChange,
  onSortChange,
  onSurprise,
}: {
  query: string;
  sort: LibrarySort;
  shelf: LibraryShelf;
  canSurprise: boolean;
  onQueryChange: (value: string) => void;
  onSortChange: (value: LibrarySort) => void;
  onSurprise: () => void;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <label className="relative min-w-0 flex-1 sm:max-w-sm">
        <span className="sr-only">Search this shelf</span>
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35m1.6-5.15a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z"
          />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search titles on this shelf…"
          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 py-2.5 pl-10 pr-3 text-sm text-neutral-100 placeholder:text-neutral-400 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 text-sm text-neutral-400">
          <span className="hidden sm:inline">Sort</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as LibrarySort)}
            aria-label="Sort shelf"
            className="min-h-10 rounded-xl border border-neutral-800 bg-neutral-950/80 px-3 text-sm font-medium text-neutral-100 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            {LIBRARY_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {shelf === "watchlist" ? (
          <Button
            type="button"
            variant="violet"
            size="sm"
            disabled={!canSurprise}
            onClick={onSurprise}
          >
            Surprise me
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function FavoritesPageClient() {
  const { user, loading: authLoading, isConfigured, openAuthModal } = useAuth();
  const {
    favorites,
    watchlist,
    watched,
    syncing: favoritesSyncing,
    error: favoritesError,
    clearError,
  } = useFavorites();
  const [shelf, selectShelf] = useLibraryShelf();
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<LibrarySort>("newest");

  const entriesByShelf = useMemo<Record<LibraryShelf, UserFavorite[]>>(
    () => ({ favorite: favorites, watchlist, watched }),
    [favorites, watchlist, watched],
  );

  const shelfEntries = entriesByShelf[shelf];

  const browsedEntries = useMemo(
    () => browseLibraryEntries(shelfEntries, { query, sort, shelf }),
    [shelfEntries, query, sort, shelf],
  );

  const movies = useMemo(
    () => browsedEntries.map(toMovieSearchResult),
    [browsedEntries],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedMovieId(null);
  }, []);

  const handleMovieSelect = useCallback((imdbID: string) => {
    setSelectedMovieId(imdbID);
    setIsModalOpen(true);
  }, []);

  const handleShelfChange = useCallback(
    (next: LibraryShelf) => {
      selectShelf(next);
      setQuery("");
      setSort("newest");
    },
    [selectShelf],
  );

  const handleSurprise = useCallback(() => {
    const pick = pickRandomLibraryEntry(browsedEntries);
    if (!pick) {
      return;
    }
    setSelectedMovieId(pick.imdbID);
    setIsModalOpen(true);
  }, [browsedEntries]);

  const resultLabel = useMemo(() => {
    if (favoritesSyncing) {
      return "Syncing your library...";
    }

    const filtered = Boolean(query.trim());
    if (filtered && browsedEntries.length !== shelfEntries.length) {
      return `${browsedEntries.length} of ${shelfEntries.length} movie${shelfEntries.length === 1 ? "" : "s"}`;
    }

    return `${browsedEntries.length} movie${browsedEntries.length === 1 ? "" : "s"}`;
  }, [
    favoritesSyncing,
    query,
    browsedEntries.length,
    shelfEntries.length,
  ]);

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

  if (authLoading) {
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
        <Button type="button" onClick={() => openAuthModal("signin")}>
          Sign In
        </Button>
      </div>
    );
  }

  const emptyState = EMPTY_STATES[shelf];
  const hasShelfMovies = shelfEntries.length > 0;
  const emptyTitle = hasShelfMovies
    ? "No titles match that search"
    : emptyState.title;
  const emptySubtitle = hasShelfMovies
    ? "Try another spelling, or clear the search box."
    : emptyState.subtitle;

  return (
    <>
      {favoritesError && (
        <div
          role="alert"
          className="mb-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 sm:flex-row sm:items-start"
        >
          <p className="min-w-0 break-words">{favoritesError}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="shrink-0 uppercase tracking-wide opacity-80 hover:opacity-100"
          >
            Dismiss
          </Button>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Library shelves"
        className="mb-6 flex flex-wrap justify-center gap-2"
      >
        {LIBRARY_TABS.map((tab) => {
          const isActive = tab.shelf === shelf;
          const count = entriesByShelf[tab.shelf].length;

          return (
            <button
              key={tab.shelf}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleShelfChange(tab.shelf)}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
                isActive
                  ? "border-violet-400/40 bg-violet-500/20 text-violet-100"
                  : "border-neutral-800 bg-neutral-900/70 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800 hover:text-white",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-bold",
                  isActive ? "bg-violet-500/30" : "bg-neutral-800",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {hasShelfMovies ? (
        <LibraryBrowseToolbar
          query={query}
          sort={sort}
          shelf={shelf}
          canSurprise={browsedEntries.length > 0}
          onQueryChange={setQuery}
          onSortChange={setSort}
          onSurprise={handleSurprise}
        />
      ) : null}

      <section>
        <MovieList
          movies={movies}
          isLoading={false}
          error={null}
          hasSearched
          onMovieSelect={handleMovieSelect}
          showInitialPrompt={false}
          loadingMessage="Loading your library..."
          emptyTitle={emptyTitle}
          emptySubtitle={emptySubtitle}
          resultLabel={resultLabel}
          priorityCount={5}
        />

        {!favoritesError && !favoritesSyncing && !hasShelfMovies && (
          <div className="mt-6 text-center">
            <Link href="/" className={buttonClass("secondary", "md")}>
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
