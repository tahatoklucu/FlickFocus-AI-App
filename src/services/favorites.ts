import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreErrorMessage } from "@/lib/errors";
import { getFirebaseDb } from "@/lib/firebase";
import type { AddFavoritePayload, UserFavorite } from "@/types";

export class FavoritesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FavoritesError";
  }
}

function favoritesCollection(userId: string) {
  return collection(getFirebaseDb(), "users", userId, "favorites");
}

function mapFavoriteDoc(
  userId: string,
  docId: string,
  data: Record<string, unknown>,
): UserFavorite {
  return {
    id: docId,
    userId,
    imdbID: String(data.imdbID ?? docId),
    title: String(data.title ?? ""),
    year: String(data.year ?? ""),
    poster: String(data.poster ?? ""),
    addedAt: String(data.addedAt ?? ""),
  };
}

function sortFavorites(favorites: UserFavorite[]): UserFavorite[] {
  return [...favorites].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

async function runFavoritesOperation<T>(
  operation: () => Promise<T>,
  fallbackMessage: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new FavoritesError(getFirestoreErrorMessage(error) || fallbackMessage);
  }
}

/** Subscribe to real-time updates for a user's favorites. */
export function subscribeToFavorites(
  userId: string,
  onUpdate: (favorites: UserFavorite[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    favoritesCollection(userId),
    (snapshot) => {
      const favorites = sortFavorites(
        snapshot.docs.map((document) =>
          mapFavoriteDoc(userId, document.id, document.data()),
        ),
      );
      onUpdate(favorites);
    },
    (error) => {
      onError?.(new FavoritesError(getFirestoreErrorMessage(error)));
    },
  );
}

/** Add a movie to the user's favorites (document ID = imdbID). */
export async function addFavorite(
  userId: string,
  payload: AddFavoritePayload,
): Promise<void> {
  await runFavoritesOperation(async () => {
    const favoriteRef = doc(
      getFirebaseDb(),
      "users",
      userId,
      "favorites",
      payload.imdbID,
    );

    await setDoc(favoriteRef, {
      imdbID: payload.imdbID,
      title: payload.title,
      year: payload.year,
      poster: payload.poster,
      addedAt: new Date().toISOString(),
    });
  }, "Failed to save favorite.");
}

/** Remove a movie from the user's favorites. */
export async function removeFavorite(
  userId: string,
  imdbID: string,
): Promise<void> {
  await runFavoritesOperation(async () => {
    const favoriteRef = doc(
      getFirebaseDb(),
      "users",
      userId,
      "favorites",
      imdbID,
    );
    await deleteDoc(favoriteRef);
  }, "Failed to remove favorite.");
}

/** Toggle favorite status; returns true if added, false if removed. */
export async function toggleFavorite(
  userId: string,
  payload: AddFavoritePayload,
  isCurrentlyFavorite: boolean,
): Promise<boolean> {
  if (isCurrentlyFavorite) {
    await removeFavorite(userId, payload.imdbID);
    return false;
  }

  await addFavorite(userId, payload);
  return true;
}
