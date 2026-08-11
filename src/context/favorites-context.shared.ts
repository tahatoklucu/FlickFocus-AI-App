"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { AddFavoritePayload, UserFavorite } from "@/types";

export interface FavoritesContextValue {
  favorites: UserFavorite[];
  favoriteIds: Set<string>;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  isFavorite: (imdbID: string) => boolean;
  toggleFavorite: (payload: AddFavoritePayload) => void;
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
