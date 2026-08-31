/** Highest personal score a user can give a movie. */
export const MAX_USER_RATING = 10;

/** Longest personal note we persist per movie. */
export const MAX_USER_NOTE_LENGTH = 500;

/**
 * A movie in a user's library (stored in Firebase). One document per movie
 * holds every relationship the user has with it, so a title can sit in the
 * watchlist without being a favorite.
 *
 * Documents written before the library existed have no flags; those are read
 * as favorites for backward compatibility.
 */
export interface UserFavorite {
  id: string;
  userId: string;
  imdbID: string;
  title: string;
  year: string;
  poster: string;
  addedAt: string;
  favorite: boolean;
  watchlist: boolean;
  /** ISO timestamp of when the user marked it watched, null when unwatched. */
  watchedAt: string | null;
  /** Personal score from 1 to MAX_USER_RATING, null when unrated. */
  rating: number | null;
  note: string | null;
  /**
   * When true the note and rating are mirrored to the public reviews
   * collection. Opt-in: entries default to private.
   */
  isPublic: boolean;
  /** ISO timestamp of the last change, used to date a published review. */
  updatedAt: string | null;
}

/** Payload used when saving a movie (server generates id and timestamps). */
export interface AddFavoritePayload {
  imdbID: string;
  title: string;
  year: string;
  poster: string;
}

/** The three library shelves a movie can appear on. */
export type LibraryShelf = "favorite" | "watchlist" | "watched";

/** Partial change applied to a library entry; omitted fields stay as they are. */
export interface LibraryEntryChanges {
  favorite?: boolean;
  watchlist?: boolean;
  watched?: boolean;
  rating?: number | null;
  note?: string | null;
  isPublic?: boolean;
}

/**
 * A review a user chose to share. Stored separately from the private library
 * so that anyone can read it, with the author's name and photo copied in at
 * publish time.
 */
export interface PublicReview {
  userId: string;
  imdbID: string;
  displayName: string;
  photoURL: string | null;
  rating: number | null;
  note: string;
  publishedAt: string;
}
