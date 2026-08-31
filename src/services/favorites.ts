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
import {
  isEmptyLibraryEntry,
  parseLibraryEntry,
  sortLibraryEntries,
  toFirestoreLibraryEntry,
} from "@/lib/library-entry";
import type { UserFavorite } from "@/types";

export class FavoritesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FavoritesError";
  }
}

function libraryCollection(userId: string) {
  return collection(getFirebaseDb(), "users", userId, "favorites");
}

function libraryDoc(userId: string, imdbID: string) {
  return doc(getFirebaseDb(), "users", userId, "favorites", imdbID);
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

/** Subscribe to real-time updates for a user's library. */
export function subscribeToFavorites(
  userId: string,
  onUpdate: (favorites: UserFavorite[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  try {
    return onSnapshot(
      libraryCollection(userId),
      (snapshot) => {
        onUpdate(
          sortLibraryEntries(
            snapshot.docs.map((document) =>
              parseLibraryEntry(userId, document.id, document.data()),
            ),
          ),
        );
      },
      (error) => {
        onError?.(new FavoritesError(getFirestoreErrorMessage(error)));
      },
    );
  } catch (error) {
    onError?.(
      new FavoritesError(
        getFirestoreErrorMessage(error) || "Failed to load favorites.",
      ),
    );
    return () => {};
  }
}

/**
 * Writes an entry, or deletes it when the user no longer has any relationship
 * with the movie, so the collection never fills up with blank documents.
 */
export async function saveLibraryEntry(
  userId: string,
  entry: UserFavorite,
): Promise<void> {
  await runFavoritesOperation(async () => {
    const entryRef = libraryDoc(userId, entry.imdbID);

    if (isEmptyLibraryEntry(entry)) {
      await deleteDoc(entryRef);
      return;
    }

    await setDoc(entryRef, toFirestoreLibraryEntry(entry));
  }, "Failed to update your library.");
}

/** Remove a movie from the user's library entirely. */
export async function removeFavorite(
  userId: string,
  imdbID: string,
): Promise<void> {
  await runFavoritesOperation(
    () => deleteDoc(libraryDoc(userId, imdbID)),
    "Failed to remove favorite.",
  );
}
