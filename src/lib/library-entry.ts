import {
  MAX_USER_NOTE_LENGTH,
  MAX_USER_RATING,
  type AddFavoritePayload,
  type LibraryEntryChanges,
  type LibraryShelf,
  type UserFavorite,
} from "@/types/favorite";

export function clampRating(rating: number | null): number | null {
  if (rating === null || !Number.isFinite(rating)) {
    return null;
  }
  const rounded = Math.round(rating);
  if (rounded < 1) {
    return null;
  }
  return Math.min(rounded, MAX_USER_RATING);
}

export function normalizeNote(note: string | null): string | null {
  if (!note) {
    return null;
  }
  const trimmed = note.trim().slice(0, MAX_USER_NOTE_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Reads a Firestore document into an entry. Documents written before the
 * library existed only had movie fields, so they count as favorites.
 */
export function parseLibraryEntry(
  userId: string,
  docId: string,
  data: Record<string, unknown>,
): UserFavorite {
  const hasShelfFlags = "favorite" in data || "watchlist" in data || "watchedAt" in data;

  return {
    id: docId,
    userId,
    imdbID: String(data.imdbID ?? docId),
    title: String(data.title ?? ""),
    year: String(data.year ?? ""),
    poster: String(data.poster ?? ""),
    addedAt: String(data.addedAt ?? ""),
    favorite: hasShelfFlags ? data.favorite === true : true,
    watchlist: data.watchlist === true,
    watchedAt: typeof data.watchedAt === "string" ? data.watchedAt : null,
    rating: clampRating(typeof data.rating === "number" ? data.rating : null),
    note: normalizeNote(typeof data.note === "string" ? data.note : null),
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null,
  };
}

export function createLibraryEntry(
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
    favorite: false,
    watchlist: false,
    watchedAt: null,
    rating: null,
    note: null,
    updatedAt: null,
  };
}

/** Applies changes to an entry, keeping untouched fields intact. */
export function applyLibraryChanges(
  entry: UserFavorite,
  changes: LibraryEntryChanges,
): UserFavorite {
  const next: UserFavorite = { ...entry, updatedAt: new Date().toISOString() };

  if (changes.favorite !== undefined) {
    next.favorite = changes.favorite;
  }

  if (changes.watchlist !== undefined) {
    next.watchlist = changes.watchlist;
  }

  if (changes.watched !== undefined) {
    next.watchedAt = changes.watched
      ? (entry.watchedAt ?? new Date().toISOString())
      : null;

    // Watching a title resolves the intent to watch it.
    if (changes.watched && changes.watchlist === undefined) {
      next.watchlist = false;
    }
  }

  if (changes.rating !== undefined) {
    next.rating = clampRating(changes.rating);
  }

  if (changes.note !== undefined) {
    next.note = normalizeNote(changes.note);
  }

  return next;
}

/** True when nothing links the user to this movie anymore, so it can be dropped. */
export function isEmptyLibraryEntry(entry: UserFavorite): boolean {
  return (
    !entry.favorite &&
    !entry.watchlist &&
    entry.watchedAt === null &&
    entry.rating === null &&
    entry.note === null
  );
}

export function isOnShelf(entry: UserFavorite, shelf: LibraryShelf): boolean {
  switch (shelf) {
    case "favorite":
      return entry.favorite;
    case "watchlist":
      // A watched title has left the queue even if the flag lingers.
      return entry.watchlist && entry.watchedAt === null;
    case "watched":
      return entry.watchedAt !== null;
  }
}

/** Newest activity first; watched entries sort by when they were watched. */
export function sortLibraryEntries(
  entries: UserFavorite[],
  shelf?: LibraryShelf,
): UserFavorite[] {
  return [...entries].sort((a, b) => {
    if (shelf === "watched") {
      return (b.watchedAt ?? "").localeCompare(a.watchedAt ?? "");
    }
    return b.addedAt.localeCompare(a.addedAt);
  });
}

/** Firestore payload for an entry, with nulls kept so fields can be cleared. */
export function toFirestoreLibraryEntry(
  entry: UserFavorite,
): Record<string, unknown> {
  return {
    imdbID: entry.imdbID,
    title: entry.title,
    year: entry.year,
    poster: entry.poster,
    addedAt: entry.addedAt,
    favorite: entry.favorite,
    watchlist: entry.watchlist,
    watchedAt: entry.watchedAt,
    rating: entry.rating,
    note: entry.note,
    updatedAt: entry.updatedAt ?? new Date().toISOString(),
  };
}
