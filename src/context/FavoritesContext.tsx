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

interface FavoritesSyncState {
  userId: string | null;
  hasRemoteSnapshot: boolean;
  favorites: UserFavorite[];
  error: string | null;
}

interface FavoritesContextValue {
  favorites: UserFavorite[];
  favoriteIds: Set<string>;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  isFavorite: (imdbID: string) => boolean;
  toggleFavorite: (payload: AddFavoritePayload) => Promise<void>;
  clearError: () => void;
}

const initialSyncState: FavoritesSyncState = {
  userId: null,
  hasRemoteSnapshot: false,
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
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid;
  const [syncState, setSyncState] =
    useState<FavoritesSyncState>(initialSyncState);

  useEffect(() => {
    if (!userId || !user || !isFirebaseConfigured()) {
      setSyncState(initialSyncState);
      return;
    }

    const activeUser = user;
    const activeUserId = userId;
    let isActive = true;
    let unsubscribe = () => {};

    setSyncState({
      userId: activeUserId,
      hasRemoteSnapshot: false,
      favorites: [],
      error: null,
    });

    async function startSubscription() {
      try {
        await activeUser.getIdToken();
        if (!isActive) {
          return;
        }

        unsubscribe = subscribeToFavorites(
          activeUserId,
          (updatedFavorites) => {
            if (!isActive) {
              return;
            }

            setSyncState({
              userId: activeUserId,
              hasRemoteSnapshot: true,
              favorites: updatedFavorites,
              error: null,
            });
          },
          (error) => {
            if (!isActive) {
              return;
            }

            setSyncState((current) => ({
              userId: activeUserId,
              hasRemoteSnapshot: true,
              favorites: current.favorites,
              error: error.message,
            }));
          },
        );
      } catch (error: unknown) {
        if (!isActive) {
          return;
        }

        setSyncState((current) => ({
          userId: activeUserId,
          hasRemoteSnapshot: true,
          favorites: current.favorites,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load favorites.",
        }));
      }
    }

    void startSubscription();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [userId, user]);

  const favorites = useMemo(() => {
    if (!userId || syncState.userId !== userId) {
      return [];
    }

    return syncState.favorites;
  }, [userId, syncState]);

  const syncing =
    !authLoading &&
    Boolean(userId) &&
    isFirebaseConfigured() &&
    syncState.userId === userId &&
    !syncState.hasRemoteSnapshot &&
    !syncState.error;

  const loading = authLoading;

  const error = useMemo(() => {
    if (!userId || syncState.userId !== userId) {
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
      syncing,
      error,
      isFavorite,
      toggleFavorite,
      clearError,
    }),
    [
      favorites,
      favoriteIds,
      loading,
      syncing,
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
