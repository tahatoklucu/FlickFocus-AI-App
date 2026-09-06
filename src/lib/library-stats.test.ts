import {
  aggregateGenres,
  computeLibraryStats,
} from "@/lib/library-stats";
import type { UserFavorite } from "@/types";

function entry(overrides: Partial<UserFavorite> = {}): UserFavorite {
  return {
    id: "tt1",
    userId: "user-1",
    imdbID: "tt1",
    title: "Inception",
    year: "2010",
    poster: "",
    addedAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    watchlist: false,
    watchedAt: null,
    rating: null,
    note: null,
    isPublic: false,
    updatedAt: null,
    ...overrides,
  };
}

describe("computeLibraryStats", () => {
  it("aggregates shelves, ratings, and decades", () => {
    const stats = computeLibraryStats([
      entry({
        imdbID: "a",
        title: "A",
        year: "1999",
        favorite: true,
        watchedAt: "2026-01-01T00:00:00.000Z",
        rating: 8,
        note: "Solid.",
      }),
      entry({
        imdbID: "b",
        title: "B",
        year: "2015",
        watchlist: true,
        rating: 6,
      }),
      entry({
        imdbID: "c",
        title: "C",
        year: "2012",
        watchedAt: "2026-03-01T00:00:00.000Z",
        rating: 10,
      }),
    ]);

    expect(stats.watchedCount).toBe(2);
    expect(stats.favoriteCount).toBe(1);
    expect(stats.watchlistCount).toBe(1);
    expect(stats.ratedCount).toBe(3);
    expect(stats.reviewCount).toBe(1);
    expect(stats.averageRating).toBe(8);
    expect(stats.ratingHistogram[10]).toBe(1);
    expect(stats.ratingHistogram[8]).toBe(1);
    expect(stats.yearBuckets.map((bucket) => bucket.label)).toEqual([
      "2010s",
      "1990s",
    ]);
    expect(stats.topRated[0]?.title).toBe("C");
    expect(stats.recentWatched[0]?.title).toBe("C");
  });
});

describe("aggregateGenres", () => {
  it("splits and ranks OMDb genre strings", () => {
    expect(
      aggregateGenres(["Action, Sci-Fi", "Sci-Fi, Drama", "Action"]),
    ).toEqual([
      { label: "Action", count: 2 },
      { label: "Sci-Fi", count: 2 },
      { label: "Drama", count: 1 },
    ]);
  });
});
