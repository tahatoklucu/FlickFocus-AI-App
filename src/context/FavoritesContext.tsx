"use client";

import type { User } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  readFavoritesCache,
  writeFavoritesCache,
} from "@/lib/favorites-cache";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  subscribeToFavorites,
  toggleFavorite as toggleFavoriteService,
} from "@/services/favorites";
import { ensureUserProfile } from "@/services/users";
import type { AddFavoritePayload, UserFavorite } from "@/types";

interface FavoritesSyncState {
  userId: string | null;
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
  toggleFavorite: (payload: AddFavoritePayload) => void;
  clearError: () => void;
}

const initialSyncState: FavoritesSyncState = {
  userId: null,
  favorites: [],
  error: null,
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

const AUTH_TOKEN_TIMEOUT_MS = 5_000;

function buildOptimisticFavorite(
  userId: string,
  payload: AddFavoritePayload,
): UserFavorite {
  return {
    id: payload.imdbID,
    userId,
    imdbID: payload.imdbID,
    title: payload.title,
    year: payload.year,
    poster: payload.poster,
    addedAt: new Date().toISOString(),
  };
}

async function waitForAuthToken(user: User): Promise<void> {
  await Promise.race([
    user.getIdToken(),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error("Authentication is still loading. Please try again."));
      }, AUTH_TOKEN_TIMEOUT_MS);
    }),
  ]);
}

function commitFavorites(
  userId: string,
  favorites: UserFavorite[],
  setSyncState: Dispatch<SetStateAction<FavoritesSyncState>>,
) {
  writeFavoritesCache(userId, favorites);
  setSyncState({
    userId,
    favorites,
    error: null,
  });
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid;
  const [syncState, setSyncState] =
    useState<FavoritesSyncState>(initialSyncState);
  const profileReadyForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !userId || !isFirebaseConfigured()) {
      return;
    }

    const activeUser = user;
    const activeUserId = userId;
    let isActive = true;
    let unsubscribe = () => {};

    async function startSync() {
      const cachedFavorites = readFavoritesCache(activeUserId);
      if (cachedFavorites.length > 0 && isActive) {
        setSyncState({
          userId: activeUserId,
          favorites: cachedFavorites,
          error: null,
        });
      }

      try {
        await waitForAuthToken(activeUser);

        if (!isActive) {
          return;
        }

        if (profileReadyForUserRef.current !== activeUserId) {
          void ensureUserProfile(activeUser)
            .then(() => {
              profileReadyForUserRef.current = activeUserId;
            })
            .catch(() => {
              // Favorites can still work when profile sync fails.
            });
        }

        unsubscribe = subscribeToFavorites(
          activeUserId,
          (updatedFavorites) => {
            if (!isActive) {
              return;
            }

            commitFavorites(activeUserId, updatedFavorites, setSyncState);
          },
          (error) => {
            if (!isActive) {
              return;
            }

            setSyncState((current) => ({
              userId: activeUserId,
              favorites:
                current.userId === activeUserId
                  ? current.favorites
                  : readFavoritesCache(activeUserId),
              error: error.message,
            }));
          },
        );
      } catch (error: unknown) {
        if (!isActive) {
          return;
        }

        setSyncState({
          userId: activeUserId,
          favorites: readFavoritesCache(activeUserId),
          error:
            error instanceof Error
              ? error.message
              : "Failed to load favorites.",
        });
      }
    }

    void startSync();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [user, userId]);

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
    syncState.userId !== userId &&
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
    (payload: AddFavoritePayload) => {
      if (!user || !userId) {
        return;
      }

      const isCurrentlyFavorite = favoriteIds.has(payload.imdbID);
      const nextFavorites = isCurrentlyFavorite
        ? favorites.filter((favorite) => favorite.imdbID !== payload.imdbID)
        : [...favorites, buildOptimisticFavorite(userId, payload)];

      commitFavorites(userId, nextFavorites, setSyncState);

      void (async () => {
        try {
          await waitForAuthToken(user);

          if (profileReadyForUserRef.current !== userId) {
            await ensureUserProfile(user);
            profileReadyForUserRef.current = userId;
          }

          await toggleFavoriteService(userId, payload, isCurrentlyFavorite);
        } catch (error) {
          const reverted = isCurrentlyFavorite
            ? [...nextFavorites, buildOptimisticFavorite(userId, payload)]
            : nextFavorites.filter(
                (favorite) => favorite.imdbID !== payload.imdbID,
              );

          commitFavorites(userId, reverted, setSyncState);
          setSyncState({
            userId,
            favorites: reverted,
            error:
              error instanceof Error
                ? error.message
                : "Failed to update favorite.",
          });
        }
      })();
    },
    [user, userId, favoriteIds, favorites],
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
