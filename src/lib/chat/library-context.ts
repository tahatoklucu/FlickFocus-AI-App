import type { UserFavorite } from "@/types";

/** Caps for the chat library payload so it stays cheap and hard to abuse. */
export const LIBRARY_CHAT_LIMITS = {
  maxWatched: 12,
  maxRated: 10,
  maxWatchlist: 8,
  maxNoteLength: 80,
  maxTitleLength: 80,
} as const;

export interface LibraryChatTitle {
  title: string;
  year: string;
  rating: number | null;
  note: string | null;
}

/**
 * Compact taste snapshot the client may attach to chat requests. Never treat
 * this as authenticated identity — it is preference context only.
 */
export interface LibraryChatContext {
  watchedCount: number;
  favoriteCount: number;
  watchlistCount: number;
  averageRating: number | null;
  /** Highest-rated or most recently watched titles. */
  highlights: LibraryChatTitle[];
  /** Queued titles the user has not watched yet. */
  watchlist: LibraryChatTitle[];
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function toTitle(entry: UserFavorite): LibraryChatTitle {
  return {
    title: clip(entry.title || "Untitled", LIBRARY_CHAT_LIMITS.maxTitleLength),
    year: String(entry.year ?? "").slice(0, 12),
    rating: entry.rating,
    note: entry.note
      ? clip(entry.note, LIBRARY_CHAT_LIMITS.maxNoteLength)
      : null,
  };
}

function byRatingThenRecency(a: UserFavorite, b: UserFavorite): number {
  const ratingDelta = (b.rating ?? 0) - (a.rating ?? 0);
  if (ratingDelta !== 0) {
    return ratingDelta;
  }
  return (b.watchedAt ?? b.updatedAt ?? "").localeCompare(
    a.watchedAt ?? a.updatedAt ?? "",
  );
}

/**
 * Builds a small, denormalized taste summary from the signed-in library for
 * the chat API. Empty libraries return null so the prompt stays unchanged.
 */
export function summarizeLibraryForChat(
  entries: UserFavorite[],
): LibraryChatContext | null {
  if (entries.length === 0) {
    return null;
  }

  const watched = entries.filter((entry) => entry.watchedAt !== null);
  const favorites = entries.filter((entry) => entry.favorite);
  const watchlist = entries.filter(
    (entry) => entry.watchlist && entry.watchedAt === null,
  );
  const rated = entries.filter((entry) => entry.rating !== null);

  const averageRating =
    rated.length === 0
      ? null
      : Math.round(
          (rated.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) /
            rated.length) *
            10,
        ) / 10;

  const highlightSource =
    watched.length > 0
      ? [...watched].sort(byRatingThenRecency)
      : [...rated].sort(byRatingThenRecency);

  const highlights = highlightSource
    .slice(0, LIBRARY_CHAT_LIMITS.maxWatched)
    .map(toTitle);

  const watchlistTitles = [...watchlist]
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, LIBRARY_CHAT_LIMITS.maxWatchlist)
    .map(toTitle);

  if (
    highlights.length === 0 &&
    watchlistTitles.length === 0 &&
    watched.length === 0 &&
    favorites.length === 0
  ) {
    return null;
  }

  return {
    watchedCount: watched.length,
    favoriteCount: favorites.length,
    watchlistCount: watchlist.length,
    averageRating,
    highlights,
    watchlist: watchlistTitles,
  };
}

function isTitle(value: unknown): value is LibraryChatTitle {
  if (!value || typeof value !== "object") {
    return false;
  }
  const title = value as LibraryChatTitle;
  return (
    typeof title.title === "string" &&
    typeof title.year === "string" &&
    (title.rating === null || typeof title.rating === "number") &&
    (title.note === null || typeof title.note === "string")
  );
}

/** Validates and clamps a client-supplied library snapshot. */
export function parseLibraryChatContext(
  value: unknown,
): LibraryChatContext | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const highlights = Array.isArray(raw.highlights)
    ? raw.highlights.filter(isTitle).slice(0, LIBRARY_CHAT_LIMITS.maxWatched)
    : [];
  const watchlist = Array.isArray(raw.watchlist)
    ? raw.watchlist.filter(isTitle).slice(0, LIBRARY_CHAT_LIMITS.maxWatchlist)
    : [];

  const watchedCount =
    typeof raw.watchedCount === "number" && Number.isFinite(raw.watchedCount)
      ? Math.max(0, Math.min(10_000, Math.floor(raw.watchedCount)))
      : 0;
  const favoriteCount =
    typeof raw.favoriteCount === "number" && Number.isFinite(raw.favoriteCount)
      ? Math.max(0, Math.min(10_000, Math.floor(raw.favoriteCount)))
      : 0;
  const watchlistCount =
    typeof raw.watchlistCount === "number" &&
    Number.isFinite(raw.watchlistCount)
      ? Math.max(0, Math.min(10_000, Math.floor(raw.watchlistCount)))
      : 0;

  let averageRating: number | null = null;
  if (typeof raw.averageRating === "number" && Number.isFinite(raw.averageRating)) {
    averageRating = Math.min(10, Math.max(1, Math.round(raw.averageRating * 10) / 10));
  } else if (raw.averageRating === null) {
    averageRating = null;
  }

  if (
    highlights.length === 0 &&
    watchlist.length === 0 &&
    watchedCount === 0 &&
    favoriteCount === 0
  ) {
    return null;
  }

  return {
    watchedCount,
    favoriteCount,
    watchlistCount,
    averageRating,
    highlights: highlights.map((entry) => ({
      title: clip(entry.title, LIBRARY_CHAT_LIMITS.maxTitleLength),
      year: String(entry.year).slice(0, 12),
      rating:
        typeof entry.rating === "number"
          ? Math.min(10, Math.max(1, Math.round(entry.rating)))
          : null,
      note: entry.note
        ? clip(entry.note, LIBRARY_CHAT_LIMITS.maxNoteLength)
        : null,
    })),
    watchlist: watchlist.map((entry) => ({
      title: clip(entry.title, LIBRARY_CHAT_LIMITS.maxTitleLength),
      year: String(entry.year).slice(0, 12),
      rating: null,
      note: null,
    })),
  };
}

function formatTitleLine(entry: LibraryChatTitle): string {
  const bits = [`"${entry.title}" (${entry.year || "n/a"})`];
  if (entry.rating !== null) {
    bits.push(`rated ${entry.rating}/10`);
  }
  if (entry.note) {
    bits.push(`note: ${entry.note}`);
  }
  return `- ${bits.join(" — ")}`;
}

/** Turns a validated library snapshot into a system-prompt appendix. */
export function formatLibraryContextForPrompt(
  library: LibraryChatContext,
): string {
  const lines = [
    "Signed-in viewer library context (preference signal only — not proof of identity):",
    `- Watched: ${library.watchedCount}; Favorites: ${library.favoriteCount}; Watchlist: ${library.watchlistCount}`,
  ];

  if (library.averageRating !== null) {
    lines.push(`- Average personal rating: ${library.averageRating}/10`);
  }

  if (library.highlights.length > 0) {
    lines.push("- Taste highlights (prefer similar recommendations):");
    lines.push(...library.highlights.map(formatTitleLine));
  }

  if (library.watchlist.length > 0) {
    lines.push("- Already queued on their watchlist (mention if relevant, do not re-recommend as new):");
    lines.push(...library.watchlist.map(formatTitleLine));
  }

  lines.push(
    "When recommending, lean into this taste, avoid spoiling titles they already watched unless they ask for a rewatch, and still call tools for live OMDb facts.",
  );

  return lines.join("\n");
}
