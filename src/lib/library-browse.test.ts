import {
  browseLibraryEntries,
  filterLibraryEntries,
  pickRandomLibraryEntry,
  sortLibraryBrowse,
} from "@/lib/library-browse";
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
    favorite: true,
    watchlist: false,
    watchedAt: null,
    rating: null,
    note: null,
    isPublic: false,
    updatedAt: null,
    ...overrides,
  };
}

describe("filterLibraryEntries", () => {
  it("matches titles case-insensitively and ignores blank queries", () => {
    const list = [
      entry({ imdbID: "a", title: "Inception" }),
      entry({ imdbID: "b", title: "The Matrix" }),
    ];

    expect(filterLibraryEntries(list, "  matrix ")).toEqual([list[1]]);
    expect(filterLibraryEntries(list, "   ")).toEqual(list);
  });
});

describe("sortLibraryBrowse", () => {
  const list = [
    entry({
      imdbID: "a",
      title: "Zodiac",
      year: "2007",
      rating: 7,
      addedAt: "2026-01-01T00:00:00.000Z",
      watchedAt: "2026-02-01T00:00:00.000Z",
    }),
    entry({
      imdbID: "b",
      title: "Amelie",
      year: "2001",
      rating: 9,
      addedAt: "2026-03-01T00:00:00.000Z",
      watchedAt: "2026-01-15T00:00:00.000Z",
    }),
    entry({
      imdbID: "c",
      title: "Heat",
      year: "1995",
      rating: null,
      addedAt: "2026-02-01T00:00:00.000Z",
    }),
  ];

  it("sorts by title, year, rating, and newest activity", () => {
    expect(
      sortLibraryBrowse(list, "title", "favorite").map((item) => item.title),
    ).toEqual(["Amelie", "Heat", "Zodiac"]);

    expect(
      sortLibraryBrowse(list, "year", "favorite").map((item) => item.year),
    ).toEqual(["2007", "2001", "1995"]);

    expect(
      sortLibraryBrowse(list, "rating", "favorite").map((item) => item.imdbID),
    ).toEqual(["b", "a", "c"]);

    // Newest uses addedAt only — later rating edits must not reshuffle the shelf.
    expect(
      sortLibraryBrowse(
        list.map((item) =>
          item.imdbID === "a"
            ? { ...item, updatedAt: "2026-12-01T00:00:00.000Z" }
            : item,
        ),
        "newest",
        "favorite",
      ).map((item) => item.imdbID),
    ).toEqual(["b", "c", "a"]);
  });

  it("uses watchedAt when sorting the watched shelf by newest", () => {
    expect(
      sortLibraryBrowse(list, "newest", "watched").map((item) => item.imdbID),
    ).toEqual(["a", "c", "b"]);
  });

  it("keeps equal-year order stable across input shuffles", () => {
    const sameYear = [
      entry({ imdbID: "tt-z", title: "Zeta", year: "2010" }),
      entry({ imdbID: "tt-a", title: "Alpha", year: "2010" }),
    ];

    const forward = sortLibraryBrowse(sameYear, "year", "favorite").map(
      (item) => item.imdbID,
    );
    const reversed = sortLibraryBrowse([...sameYear].reverse(), "year", "favorite").map(
      (item) => item.imdbID,
    );

    expect(forward).toEqual(reversed);
    expect(forward).toEqual(["tt-a", "tt-z"]);
  });
});

describe("browseLibraryEntries", () => {
  it("filters then sorts", () => {
    const list = [
      entry({ imdbID: "a", title: "Dark Knight", year: "2008", rating: 8 }),
      entry({ imdbID: "b", title: "Dark Waters", year: "2019", rating: 7 }),
      entry({ imdbID: "c", title: "Amelie", year: "2001", rating: 9 }),
    ];

    expect(
      browseLibraryEntries(list, {
        query: "dark",
        sort: "rating",
        shelf: "favorite",
      }).map((item) => item.imdbID),
    ).toEqual(["a", "b"]);
  });
});

describe("pickRandomLibraryEntry", () => {
  it("returns null for an empty shelf", () => {
    expect(pickRandomLibraryEntry([])).toBeNull();
  });

  it("uses the provided random source", () => {
    const list = [
      entry({ imdbID: "a" }),
      entry({ imdbID: "b" }),
      entry({ imdbID: "c" }),
    ];

    expect(pickRandomLibraryEntry(list, () => 0)?.imdbID).toBe("a");
    expect(pickRandomLibraryEntry(list, () => 0.99)?.imdbID).toBe("c");
  });
});
