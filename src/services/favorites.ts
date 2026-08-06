import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { AddFavoritePayload, UserFavorite } from "@/types";

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

/** Subscribe to real-time updates for a user's favorites. */
export function subscribeToFavorites(
  userId: string,
  onUpdate: (favorites: UserFavorite[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const favoritesQuery = query(
    favoritesCollection(userId),
    orderBy("addedAt", "desc"),
  );

  return onSnapshot(
    favoritesQuery,
    (snapshot) => {
      const favorites = snapshot.docs.map((document) =>
        mapFavoriteDoc(userId, document.id, document.data()),
      );
      onUpdate(favorites);
    },
    (error) => {
      onError?.(error);
    },
  );
}

/** Add a movie to the user's favorites (document ID = imdbID). */
export async function addFavorite(
  userId: string,
  payload: AddFavoritePayload,
): Promise<void> {
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
}

/** Remove a movie from the user's favorites. */
export async function removeFavorite(
  userId: string,
  imdbID: string,
): Promise<void> {
  const favoriteRef = doc(getFirebaseDb(), "users", userId, "favorites", imdbID);
  await deleteDoc(favoriteRef);
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
