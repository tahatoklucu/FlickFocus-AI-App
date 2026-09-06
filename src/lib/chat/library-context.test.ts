import {
  formatLibraryContextForPrompt,
  parseLibraryChatContext,
  summarizeLibraryForChat,
} from "@/lib/chat/library-context";
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
    watchedAt: "2026-02-01T00:00:00.000Z",
    rating: 9,
    note: "Dream heist that still holds up.",
    isPublic: false,
    updatedAt: "2026-02-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("summarizeLibraryForChat", () => {
  it("returns null for an empty library", () => {
    expect(summarizeLibraryForChat([])).toBeNull();
  });

  it("caps highlights and prefers highly rated watched titles", () => {
    const summary = summarizeLibraryForChat([
      entry({
        imdbID: "tt-low",
        title: "Okay Film",
        rating: 5,
        watchedAt: "2026-01-01T00:00:00.000Z",
      }),
      entry({
        imdbID: "tt-high",
        title: "Great Film",
        rating: 10,
        watchedAt: "2026-01-02T00:00:00.000Z",
      }),
      entry({
        imdbID: "tt-queue",
        title: "Queued",
        watchedAt: null,
        watchlist: true,
        rating: null,
        note: null,
      }),
    ]);

    expect(summary?.watchedCount).toBe(2);
    expect(summary?.watchlistCount).toBe(1);
    expect(summary?.averageRating).toBe(7.5);
    expect(summary?.highlights[0]?.title).toBe("Great Film");
    expect(summary?.watchlist[0]?.title).toBe("Queued");
  });
});

describe("parseLibraryChatContext", () => {
  it("drops junk and clamps oversized fields", () => {
    const parsed = parseLibraryChatContext({
      watchedCount: 3,
      favoriteCount: 1,
      watchlistCount: 0,
      averageRating: 11,
      highlights: [
        {
          title: "x".repeat(200),
          year: "2010-extra",
          rating: 9.6,
          note: "y".repeat(200),
        },
        { title: 42 },
      ],
      watchlist: [{ title: "Later", year: "2024", rating: null, note: null }],
    });

    expect(parsed?.averageRating).toBe(10);
    expect(parsed?.highlights).toHaveLength(1);
    expect(parsed?.highlights[0]?.title.endsWith("…")).toBe(true);
    expect(parsed?.highlights[0]?.note?.endsWith("…")).toBe(true);
    expect(parsed?.watchlist[0]?.title).toBe("Later");
  });

  it("returns null when nothing useful remains", () => {
    expect(parseLibraryChatContext({ watchedCount: 0, highlights: [] })).toBeNull();
    expect(parseLibraryChatContext(null)).toBeNull();
  });
});

describe("formatLibraryContextForPrompt", () => {
  it("mentions taste guidance for the model", () => {
    const text = formatLibraryContextForPrompt({
      watchedCount: 2,
      favoriteCount: 1,
      watchlistCount: 0,
      averageRating: 8.5,
      highlights: [
        {
          title: "Inception",
          year: "2010",
          rating: 9,
          note: "Still the best heist movie.",
        },
      ],
      watchlist: [],
    });

    expect(text).toContain("Average personal rating: 8.5/10");
    expect(text).toContain("Inception");
    expect(text).toContain("avoid spoiling titles they already watched");
  });
});
