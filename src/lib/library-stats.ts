import type { UserFavorite } from "@/types";

export interface NamedCount {
  label: string;
  count: number;
}

export interface LibraryStats {
  totalEntries: number;
  favoriteCount: number;
  watchlistCount: number;
  watchedCount: number;
  ratedCount: number;
  reviewCount: number;
  averageRating: number | null;
  /** Counts for scores 1..10 (index 0 unused). */
  ratingHistogram: number[];
  yearBuckets: NamedCount[];
  topRated: UserFavorite[];
  recentWatched: UserFavorite[];
}

function parseYear(value: string): number | null {
  const match = value.match(/\d{4}/);
  if (!match) {
    return null;
  }
  const year = Number(match[0]);
  return year >= 1888 && year <= 2100 ? year : null;
}

function decadeLabel(year: number): string {
  const start = Math.floor(year / 10) * 10;
  return `${start}s`;
}

/**
 * Aggregates shelf, rating, and year stats from the user's library. Genre is
 * intentionally omitted here — library documents do not store it; the stats
 * page enriches genres separately from OMDb.
 */
export function computeLibraryStats(entries: UserFavorite[]): LibraryStats {
  const favorites = entries.filter((entry) => entry.favorite);
  const watchlist = entries.filter(
    (entry) => entry.watchlist && entry.watchedAt === null,
  );
  const watched = entries.filter((entry) => entry.watchedAt !== null);
  const rated = entries.filter((entry) => entry.rating !== null);
  const reviews = entries.filter((entry) => Boolean(entry.note));

  const ratingHistogram = Array.from({ length: 11 }, () => 0);
  for (const entry of rated) {
    const score = entry.rating;
    if (score !== null && score >= 1 && score <= 10) {
      ratingHistogram[score] += 1;
    }
  }

  const averageRating =
    rated.length === 0
      ? null
      : Math.round(
          (rated.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) /
            rated.length) *
            10,
        ) / 10;

  const yearMap = new Map<string, number>();
  for (const entry of entries) {
    const year = parseYear(entry.year);
    if (year === null) {
      continue;
    }
    const label = decadeLabel(year);
    yearMap.set(label, (yearMap.get(label) ?? 0) + 1);
  }

  const yearBuckets = [...yearMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.label.localeCompare(a.label));

  const topRated = [...rated]
    .sort((a, b) => {
      const ratingDelta = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDelta !== 0) {
        return ratingDelta;
      }
      return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
    })
    .slice(0, 5);

  const recentWatched = [...watched]
    .sort((a, b) => (b.watchedAt ?? "").localeCompare(a.watchedAt ?? ""))
    .slice(0, 5);

  return {
    totalEntries: entries.length,
    favoriteCount: favorites.length,
    watchlistCount: watchlist.length,
    watchedCount: watched.length,
    ratedCount: rated.length,
    reviewCount: reviews.length,
    averageRating,
    ratingHistogram,
    yearBuckets,
    topRated,
    recentWatched,
  };
}

/** Aggregates comma-separated OMDb genre strings into a sorted frequency list. */
export function aggregateGenres(genreLists: string[]): NamedCount[] {
  const counts = new Map<string, number>();

  for (const list of genreLists) {
    for (const part of list.split(",")) {
      const label = part.trim();
      if (!label || label === "N/A") {
        continue;
      }
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
