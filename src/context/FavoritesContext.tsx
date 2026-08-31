"use client";

import type { User } from "firebase/auth";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useAuth } from "@/context/auth-context.shared";
import {
  FavoritesContext,
  type FavoritesContextValue,
} from "@/context/favorites-context.shared";
import {
  readFavoritesCache,
  writeFavoritesCache,
} from "@/lib/profile/favorites-cache";
import {
  applyLibraryChanges,
  createLibraryEntry,
  isEmptyLibraryEntry,
  isOnShelf,
  sortLibraryEntries,
} from "@/lib/library-entry";
import { isFirebaseConfigured } from "@/lib/firebase";
import type {
  AddFavoritePayload,
  LibraryEntryChanges,
  UserFavorite,
} from "@/types";

export { useFavorites } from "@/context/favorites-context.shared";

interface FavoritesSyncState {
  userId: string | null;
  favorites: UserFavorite[];
  error: string | null;
}

const initialSyncState: FavoritesSyncState = {
  userId: null,
  favorites: [],
  error: null,
};

const AUTH_TOKEN_TIMEOUT_MS = 5_000;

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
      const { subscribeToFavorites } = await import("@/services/favorites");
      const { ensureUserProfile } = await import("@/services/users");

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

  const entries = useMemo(() => {
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

  const favorites = useMemo(
    () => sortLibraryEntries(entries.filter((entry) => isOnShelf(entry, "favorite"))),
    [entries],
  );

  const watchlist = useMemo(
    () => sortLibraryEntries(entries.filter((entry) => isOnShelf(entry, "watchlist"))),
    [entries],
  );

  const watched = useMemo(
    () =>
      sortLibraryEntries(
        entries.filter((entry) => isOnShelf(entry, "watched")),
        "watched",
      ),
    [entries],
  );

  const favoriteIds = useMemo(
    () => new Set(favorites.map((entry) => entry.imdbID)),
    [favorites],
  );

  const watchlistIds = useMemo(
    () => new Set(watchlist.map((entry) => entry.imdbID)),
    [watchlist],
  );

  const watchedIds = useMemo(
    () => new Set(watched.map((entry) => entry.imdbID)),
    [watched],
  );

  const entryMap = useMemo(
    () => new Map(entries.map((entry) => [entry.imdbID, entry])),
    [entries],
  );

  const getEntry = useCallback(
    (imdbID: string) => entryMap.get(imdbID) ?? null,
    [entryMap],
  );

  const isFavorite = useCallback(
    (imdbID: string) => favoriteIds.has(imdbID),
    [favoriteIds],
  );

  const isInWatchlist = useCallback(
    (imdbID: string) => watchlistIds.has(imdbID),
    [watchlistIds],
  );

  const isWatched = useCallback(
    (imdbID: string) => watchedIds.has(imdbID),
    [watchedIds],
  );

  const clearError = useCallback(() => {
    setSyncState((current) =>
      current.error ? { ...current, error: null } : current,
    );
  }, []);

  const updateEntry = useCallback(
    (payload: AddFavoritePayload, changes: LibraryEntryChanges) => {
      if (!user || !userId) {
        return;
      }

      const previousEntries = entries;
      const existing = entryMap.get(payload.imdbID);
      const base = existing ?? createLibraryEntry(userId, payload);
      const nextEntry = applyLibraryChanges(base, changes);

      const withoutMovie = previousEntries.filter(
        (entry) => entry.imdbID !== payload.imdbID,
      );
      const optimisticEntries = isEmptyLibraryEntry(nextEntry)
        ? withoutMovie
        : [...withoutMovie, nextEntry];

      commitFavorites(userId, sortLibraryEntries(optimisticEntries), setSyncState);

      void (async () => {
        try {
          await waitForAuthToken(user);

          const { ensureUserProfile } = await import("@/services/users");
          const { saveLibraryEntry } = await import("@/services/favorites");

          if (profileReadyForUserRef.current !== userId) {
            await ensureUserProfile(user);
            profileReadyForUserRef.current = userId;
          }

          await saveLibraryEntry(userId, nextEntry);
        } catch (updateError) {
          commitFavorites(userId, previousEntries, setSyncState);
          setSyncState({
            userId,
            favorites: previousEntries,
            error:
              updateError instanceof Error
                ? updateError.message
                : "Failed to update your library.",
          });
        }
      })();
    },
    [user, userId, entries, entryMap],
  );

  const toggleFavorite = useCallback(
    (payload: AddFavoritePayload) => {
      updateEntry(payload, {
        favorite: !favoriteIds.has(payload.imdbID),
      });
    },
    [updateEntry, favoriteIds],
  );

  const toggleWatchlist = useCallback(
    (payload: AddFavoritePayload) => {
      const next = !watchlistIds.has(payload.imdbID);
      // Queueing a title again means the user wants to rewatch it.
      updateEntry(payload, next ? { watchlist: true, watched: false } : { watchlist: false });
    },
    [updateEntry, watchlistIds],
  );

  const toggleWatched = useCallback(
    (payload: AddFavoritePayload) => {
      updateEntry(payload, { watched: !watchedIds.has(payload.imdbID) });
    },
    [updateEntry, watchedIds],
  );

  const removeEntry = useCallback(
    (imdbID: string) => {
      if (!user || !userId) {
        return;
      }

      const previousEntries = entries;
      commitFavorites(
        userId,
        previousEntries.filter((entry) => entry.imdbID !== imdbID),
        setSyncState,
      );

      void (async () => {
        try {
          await waitForAuthToken(user);
          const { removeFavorite } = await import("@/services/favorites");
          await removeFavorite(userId, imdbID);
        } catch (removeError) {
          commitFavorites(userId, previousEntries, setSyncState);
          setSyncState({
            userId,
            favorites: previousEntries,
            error:
              removeError instanceof Error
                ? removeError.message
                : "Failed to remove that movie.",
          });
        }
      })();
    },
    [user, userId, entries],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      entries,
      favorites,
      watchlist,
      watched,
      favoriteIds,
      watchlistIds,
      watchedIds,
      loading,
      syncing,
      error,
      getEntry,
      isFavorite,
      isInWatchlist,
      isWatched,
      toggleFavorite,
      toggleWatchlist,
      toggleWatched,
      updateEntry,
      removeEntry,
      clearError,
    }),
    [
      entries,
      favorites,
      watchlist,
      watched,
      favoriteIds,
      watchlistIds,
      watchedIds,
      loading,
      syncing,
      error,
      getEntry,
      isFavorite,
      isInWatchlist,
      isWatched,
      toggleFavorite,
      toggleWatchlist,
      toggleWatched,
      updateEntry,
      removeEntry,
      clearError,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
