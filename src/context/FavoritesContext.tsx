"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

interface FavoritesSyncState {
  userId: string | null;
  hasReceivedSnapshot: boolean;
  favorites: UserFavorite[];
  error: string | null;
}

interface FavoritesContextValue {
  favorites: UserFavorite[];
  favoriteIds: Set<string>;
  loading: boolean;
  error: string | null;
  isFavorite: (imdbID: string) => boolean;
  toggleFavorite: (payload: AddFavoritePayload) => Promise<void>;
  clearError: () => void;
}

const initialSyncState: FavoritesSyncState = {
  userId: null,
  hasReceivedSnapshot: false,
  favorites: [],
  error: null,
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

/**
 * Layout-level provider: one Firestore listener persists across page navigations
 * and is torn down only when the signed-in user changes or the app unmounts.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.uid;
  const [syncState, setSyncState] =
    useState<FavoritesSyncState>(initialSyncState);
  const activeSubscriptionUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || !isFirebaseConfigured()) {
      activeSubscriptionUserIdRef.current = null;
      return;
    }

    activeSubscriptionUserIdRef.current = userId;
    let isActive = true;

    const timeoutId = window.setTimeout(() => {
      if (!isActive) {
        return;
      }

      setSyncState((current) => {
        if (current.userId === userId && current.hasReceivedSnapshot) {
          return current;
        }

        return {
          userId,
          hasReceivedSnapshot: true,
          favorites: [],
          error: "Timed out loading favorites. Please refresh and try again.",
        };
      });
    }, 10_000);

    const unsubscribe = subscribeToFavorites(
      userId,
      (updatedFavorites) => {
        if (!isActive) {
          return;
        }

        setSyncState({
          userId,
          hasReceivedSnapshot: true,
          favorites: updatedFavorites,
          error: null,
        });
      },
      (error) => {
        if (!isActive) {
          return;
        }

        setSyncState({
          userId,
          hasReceivedSnapshot: true,
          favorites: [],
          error: error.message,
        });
      },
    );

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
      unsubscribe();

      if (activeSubscriptionUserIdRef.current === userId) {
        activeSubscriptionUserIdRef.current = null;
      }
    };
  }, [userId]);

  const favorites = useMemo(() => {
    if (
      !userId ||
      syncState.userId !== userId ||
      !syncState.hasReceivedSnapshot
    ) {
      return [];
    }

    return syncState.favorites;
  }, [userId, syncState]);

  const loading =
    Boolean(userId) &&
    isFirebaseConfigured() &&
    (!syncState.hasReceivedSnapshot || syncState.userId !== userId);

  const error = useMemo(() => {
    if (
      !userId ||
      syncState.userId !== userId ||
      !syncState.hasReceivedSnapshot
    ) {
      return null;
    }

    return syncState.error;
  }, [userId, syncState]);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.imdbID)),
    [favorites],
  );

  const isFavorite = useCallback(
    (imdbID: string) => favoriteIds.has(imdbID),
    [favoriteIds],
  );

  const clearError = useCallback(() => {
    setSyncState((current) =>
      current.error ? { ...current, error: null } : current,
    );
  }, []);

  const toggleFavorite = useCallback(
    async (payload: AddFavoritePayload) => {
      if (!userId) {
        throw new Error("You must be signed in to manage favorites.");
      }

      await toggleFavoriteService(
        userId,
        payload,
        favoriteIds.has(payload.imdbID),
      );
    },
    [userId, favoriteIds],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      favoriteIds,
      loading,
      error,
      isFavorite,
      toggleFavorite,
      clearError,
    }),
    [
      favorites,
      favoriteIds,
      loading,
      error,
      isFavorite,
      toggleFavorite,
      clearError,
    ],
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
