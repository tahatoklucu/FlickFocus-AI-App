"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type {
  AddFavoritePayload,
  LibraryEntryChanges,
  UserFavorite,
} from "@/types";

export interface FavoritesContextValue {
  /** Every saved movie, whichever shelf it sits on. */
  entries: UserFavorite[];
  favorites: UserFavorite[];
  watchlist: UserFavorite[];
  watched: UserFavorite[];
  favoriteIds: Set<string>;
  watchlistIds: Set<string>;
  watchedIds: Set<string>;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  getEntry: (imdbID: string) => UserFavorite | null;
  isFavorite: (imdbID: string) => boolean;
  isInWatchlist: (imdbID: string) => boolean;
  isWatched: (imdbID: string) => boolean;
  toggleFavorite: (payload: AddFavoritePayload) => void;
  toggleWatchlist: (payload: AddFavoritePayload) => void;
  toggleWatched: (payload: AddFavoritePayload) => void;
  /** Applies an arbitrary change (rating, note, flags) to one movie. */
  updateEntry: (payload: AddFavoritePayload, changes: LibraryEntryChanges) => void;
  removeEntry: (imdbID: string) => void;
  clearError: () => void;
}

export const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider.");
  }

  return context;
}

export type FavoritesProviderProps = {
  children: ReactNode;
};
