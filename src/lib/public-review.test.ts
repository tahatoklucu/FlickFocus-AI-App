import {
  parsePublicReview,
  sortPublicReviews,
  toPublicReview,
} from "@/lib/public-review";
import type { UserFavorite } from "@/types";

function entry(overrides: Partial<UserFavorite> = {}): UserFavorite {
  return {
    id: "tt1375666",
    userId: "user-1",
    imdbID: "tt1375666",
    title: "Inception",
    year: "2010",
    poster: "",
    addedAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    watchlist: false,
    watchedAt: null,
    rating: 8,
    note: "Holds up.",
    isPublic: true,
    updatedAt: "2026-02-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("toPublicReview", () => {
  it("copies the author identity in at publish time", () => {
    const review = toPublicReview(entry(), {
      displayName: "  Taha  ",
      photoURL: "https://example.com/a.png",
    });

    expect(review).toEqual({
      userId: "user-1",
      imdbID: "tt1375666",
      displayName: "Taha",
      photoURL: "https://example.com/a.png",
      rating: 8,
      note: "Holds up.",
      publishedAt: "2026-02-02T00:00:00.000Z",
    });
  });

  it("returns null for private entries and for entries without a note", () => {
    const author = { displayName: "Taha", photoURL: null };

    expect(toPublicReview(entry({ isPublic: false }), author)).toBeNull();
    expect(toPublicReview(entry({ note: null }), author)).toBeNull();
  });

  it("falls back to a generic name when the author has none", () => {
    const review = toPublicReview(entry(), { displayName: "   ", photoURL: "" });

    expect(review?.displayName).toBe("FlickFocus viewer");
    expect(review?.photoURL).toBeNull();
  });
});

describe("parsePublicReview", () => {
  it("fills in defaults for missing or wrong-typed fields", () => {
    const review = parsePublicReview("tt0111161", "user-9", {
      note: "  Perfect.  ",
      rating: "nine",
    });

    expect(review).toEqual({
      userId: "user-9",
      imdbID: "tt0111161",
      displayName: "FlickFocus viewer",
      photoURL: null,
      rating: null,
      note: "Perfect.",
      publishedAt: "",
    });
  });
});

describe("sortPublicReviews", () => {
  it("drops empty notes and lists the newest first", () => {
    const reviews = sortPublicReviews([
      parsePublicReview("tt1", "a", { note: "older", publishedAt: "2026-01-01" }),
      parsePublicReview("tt1", "b", { note: "  ", publishedAt: "2026-05-01" }),
      parsePublicReview("tt1", "c", { note: "newer", publishedAt: "2026-03-01" }),
    ]);

    expect(reviews.map((review) => review.userId)).toEqual(["c", "a"]);
  });
});
