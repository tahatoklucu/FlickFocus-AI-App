import { clampRating, normalizeNote } from "@/lib/library-entry";
import type { PublicReview, UserFavorite } from "@/types";

/** Reads a shared review document, tolerating missing or wrong-typed fields. */
export function parsePublicReview(
  imdbID: string,
  docId: string,
  data: Record<string, unknown>,
): PublicReview {
  const photoURL = typeof data.photoURL === "string" ? data.photoURL.trim() : "";

  return {
    userId: String(data.userId ?? docId),
    imdbID: String(data.imdbID ?? imdbID),
    displayName:
      typeof data.displayName === "string" && data.displayName.trim()
        ? data.displayName.trim()
        : "FlickFocus viewer",
    photoURL: photoURL || null,
    rating: clampRating(typeof data.rating === "number" ? data.rating : null),
    note: normalizeNote(typeof data.note === "string" ? data.note : null) ?? "",
    publishedAt: typeof data.publishedAt === "string" ? data.publishedAt : "",
  };
}

/** Newest first. */
export function sortPublicReviews(reviews: PublicReview[]): PublicReview[] {
  return [...reviews]
    .filter((review) => review.note.length > 0)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * The shared copy of a library entry. Author name and photo are denormalized
 * so readers never need access to other users' profiles.
 */
export function toPublicReview(
  entry: UserFavorite,
  author: { displayName: string; photoURL: string | null },
): PublicReview | null {
  if (!entry.isPublic || !entry.note) {
    return null;
  }

  return {
    userId: entry.userId,
    imdbID: entry.imdbID,
    displayName: author.displayName.trim().slice(0, 100) || "FlickFocus viewer",
    photoURL: author.photoURL?.trim() || null,
    rating: entry.rating,
    note: entry.note,
    publishedAt: entry.updatedAt ?? new Date().toISOString(),
  };
}
