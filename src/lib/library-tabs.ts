import type { LibraryShelf } from "@/types";

export const LIBRARY_TABS: ReadonlyArray<{
  shelf: LibraryShelf;
  label: string;
  param: string;
}> = [
  { shelf: "favorite", label: "Favorites", param: "favorites" },
  { shelf: "watchlist", label: "Watchlist", param: "watchlist" },
  { shelf: "watched", label: "Watched", param: "watched" },
];

export const DEFAULT_LIBRARY_SHELF: LibraryShelf = "favorite";

/**
 * Menu order, newest activity first: what you just watched, then what is
 * queued, then the long-term favorites.
 */
export const MENU_LIBRARY_TABS = (
  ["watched", "watchlist", "favorite"] as const
).map((shelf) => {
  const tab = LIBRARY_TABS.find((entry) => entry.shelf === shelf);
  if (!tab) {
    throw new Error(`Unknown library shelf: ${shelf}`);
  }
  return tab;
});

export function parseLibraryShelf(search: string): LibraryShelf {
  const value = new URLSearchParams(search).get("tab")?.toLowerCase();
  const match = LIBRARY_TABS.find((tab) => tab.param === value);
  return match ? match.shelf : DEFAULT_LIBRARY_SHELF;
}

export function buildLibraryShelfQuery(shelf: LibraryShelf): string {
  if (shelf === DEFAULT_LIBRARY_SHELF) {
    return "";
  }
  const match = LIBRARY_TABS.find((tab) => tab.shelf === shelf);
  return match ? `?tab=${match.param}` : "";
}
