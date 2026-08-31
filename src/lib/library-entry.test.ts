import { describe, expect, it } from "vitest";
import {
  applyLibraryChanges,
  clampRating,
  createLibraryEntry,
  isEmptyLibraryEntry,
  isOnShelf,
  normalizeNote,
  parseLibraryEntry,
  sortLibraryEntries,
} from "@/lib/library-entry";
import { MAX_USER_NOTE_LENGTH, MAX_USER_RATING } from "@/types";

const payload = {
  imdbID: "tt1375666",
  title: "Inception",
  year: "2010",
  poster: "https://example.com/poster.jpg",
};

describe("clampRating", () => {
  it("keeps scores inside 1..MAX and treats junk as unrated", () => {
    expect(clampRating(8)).toBe(8);
    expect(clampRating(99)).toBe(MAX_USER_RATING);
    expect(clampRating(0)).toBeNull();
    expect(clampRating(-3)).toBeNull();
    expect(clampRating(7.4)).toBe(7);
    expect(clampRating(Number.NaN)).toBeNull();
    expect(clampRating(null)).toBeNull();
  });
});

describe("normalizeNote", () => {
  it("trims, caps length, and drops blank notes", () => {
    expect(normalizeNote("  loved it  ")).toBe("loved it");
    expect(normalizeNote("   ")).toBeNull();
    expect(normalizeNote(null)).toBeNull();
    expect(normalizeNote("x".repeat(MAX_USER_NOTE_LENGTH + 50))).toHaveLength(
      MAX_USER_NOTE_LENGTH,
    );
  });
});

describe("parseLibraryEntry", () => {
  it("treats legacy documents without shelf flags as favorites", () => {
    const entry = parseLibraryEntry("user-1", "tt1375666", {
      imdbID: "tt1375666",
      title: "Inception",
      year: "2010",
      poster: "poster.jpg",
      addedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(entry.favorite).toBe(true);
    expect(entry.watchlist).toBe(false);
    expect(entry.watchedAt).toBeNull();
    expect(entry.rating).toBeNull();
  });

  it("reads shelf flags, rating, and note when present", () => {
    const entry = parseLibraryEntry("user-1", "tt0133093", {
      favorite: false,
      watchlist: true,
      watchedAt: "2026-02-02T00:00:00.000Z",
      rating: 9,
      note: "  rewatch  ",
    });

    expect(entry.favorite).toBe(false);
    expect(entry.watchlist).toBe(true);
    expect(entry.watchedAt).toBe("2026-02-02T00:00:00.000Z");
    expect(entry.rating).toBe(9);
    expect(entry.note).toBe("rewatch");
  });
});

describe("applyLibraryChanges", () => {
  const base = createLibraryEntry("user-1", payload);

  it("only touches the fields it is given", () => {
    const rated = applyLibraryChanges(base, { rating: 7 });

    expect(rated.rating).toBe(7);
    expect(rated.favorite).toBe(false);
    expect(rated.note).toBeNull();
  });

  it("clears the watchlist when a movie is marked watched", () => {
    const queued = applyLibraryChanges(base, { watchlist: true });
    const seen = applyLibraryChanges(queued, { watched: true });

    expect(seen.watchedAt).not.toBeNull();
    expect(seen.watchlist).toBe(false);
  });

  it("keeps the original watched timestamp on later edits", () => {
    const seen = applyLibraryChanges(base, { watched: true });
    const rated = applyLibraryChanges(seen, { watched: true, rating: 6 });

    expect(rated.watchedAt).toBe(seen.watchedAt);
  });

  it("drops the timestamp when unmarking watched", () => {
    const seen = applyLibraryChanges(base, { watched: true });

    expect(applyLibraryChanges(seen, { watched: false }).watchedAt).toBeNull();
  });

  it("stops sharing a review once its note is deleted", () => {
    const shared = applyLibraryChanges(base, {
      note: "Worth a rewatch.",
      isPublic: true,
    });
    expect(shared.isPublic).toBe(true);

    expect(applyLibraryChanges(shared, { note: null }).isPublic).toBe(false);
  });
});

describe("isEmptyLibraryEntry", () => {
  const base = createLibraryEntry("user-1", payload);

  it("is empty only when no shelf, rating, or note remains", () => {
    expect(isEmptyLibraryEntry(base)).toBe(true);
    expect(isEmptyLibraryEntry(applyLibraryChanges(base, { favorite: true }))).toBe(false);
    expect(isEmptyLibraryEntry(applyLibraryChanges(base, { rating: 5 }))).toBe(false);
    expect(isEmptyLibraryEntry(applyLibraryChanges(base, { note: "hi" }))).toBe(false);
  });
});

describe("isOnShelf", () => {
  const base = createLibraryEntry("user-1", payload);

  it("removes watched titles from the watchlist shelf", () => {
    const queued = applyLibraryChanges(base, { watchlist: true });
    expect(isOnShelf(queued, "watchlist")).toBe(true);

    const seen = applyLibraryChanges(queued, { watchlist: true, watched: true });
    expect(isOnShelf(seen, "watchlist")).toBe(false);
    expect(isOnShelf(seen, "watched")).toBe(true);
  });
});

describe("sortLibraryEntries", () => {
  it("sorts watched entries by when they were watched", () => {
    const older = {
      ...createLibraryEntry("user-1", payload),
      imdbID: "older",
      addedAt: "2026-05-05T00:00:00.000Z",
      watchedAt: "2026-01-01T00:00:00.000Z",
    };
    const newer = {
      ...createLibraryEntry("user-1", payload),
      imdbID: "newer",
      addedAt: "2026-01-01T00:00:00.000Z",
      watchedAt: "2026-06-06T00:00:00.000Z",
    };

    expect(sortLibraryEntries([older, newer], "watched").map((e) => e.imdbID)).toEqual([
      "newer",
      "older",
    ]);
    expect(sortLibraryEntries([newer, older]).map((e) => e.imdbID)).toEqual([
      "older",
      "newer",
    ]);
  });
});
