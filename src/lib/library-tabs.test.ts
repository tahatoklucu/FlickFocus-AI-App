import { describe, expect, it } from "vitest";
import {
  buildLibraryShelfQuery,
  DEFAULT_LIBRARY_SHELF,
  parseLibraryShelf,
} from "@/lib/library-tabs";

describe("library tabs", () => {
  it("reads a shelf from the url and falls back to the default", () => {
    expect(parseLibraryShelf("?tab=watchlist")).toBe("watchlist");
    expect(parseLibraryShelf("?tab=WATCHED")).toBe("watched");
    expect(parseLibraryShelf("?tab=nonsense")).toBe(DEFAULT_LIBRARY_SHELF);
    expect(parseLibraryShelf("")).toBe(DEFAULT_LIBRARY_SHELF);
  });

  it("round-trips every shelf and keeps the default url clean", () => {
    expect(buildLibraryShelfQuery("favorite")).toBe("");
    for (const shelf of ["favorite", "watchlist", "watched"] as const) {
      expect(parseLibraryShelf(buildLibraryShelfQuery(shelf))).toBe(shelf);
    }
  });
});
