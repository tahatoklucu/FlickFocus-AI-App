"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  subscribeToFavorites,
  toggleFavorite as toggleFavoriteService,
} from "@/services/favorites";
import type { AddFavoritePayload, UserFavorite } from "@/types";

interface FavoritesContextValue {
  favorites: UserFavorite[];
  favoriteIds: Set<string>;
  loading: boolean;
  isFavorite: (imdbID: string) => boolean;
  toggleFavorite: (payload: AddFavoritePayload) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoritesSnapshot, setFavoritesSnapshot] = useState<{
    userId: string;
    favorites: UserFavorite[];
  } | null>(null);

  useEffect(() => {
    if (!user || !isFirebaseConfigured()) {
      return;
    }

    const unsubscribe = subscribeToFavorites(
      user.uid,
      (updatedFavorites) => {
        setFavoritesSnapshot({
          userId: user.uid,
          favorites: updatedFavorites,
        });
      },
      () => {
        setFavoritesSnapshot({
          userId: user.uid,
          favorites: [],
        });
      },
    );

    return unsubscribe;
  }, [user]);

  const favorites = useMemo(() => {
    if (!user || favoritesSnapshot?.userId !== user.uid) {
      return [];
    }

    return favoritesSnapshot.favorites;
  }, [user, favoritesSnapshot]);

  const loading = Boolean(user) && favoritesSnapshot?.userId !== user?.uid;

  const favoriteIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.imdbID)),
    [favorites],
  );

  const isFavorite = useCallback(
    (imdbID: string) => favoriteIds.has(imdbID),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    async (payload: AddFavoritePayload) => {
      if (!user) {
        throw new Error("You must be signed in to manage favorites.");
      }

      await toggleFavoriteService(
        user.uid,
        payload,
        favoriteIds.has(payload.imdbID),
      );
    },
    [user, favoriteIds],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      favoriteIds,
      loading,
      isFavorite,
      toggleFavorite,
    }),
    [favorites, favoriteIds, loading, isFavorite, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider.");
  }

  return context;
}
