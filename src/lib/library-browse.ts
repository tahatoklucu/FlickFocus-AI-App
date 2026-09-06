import type { LibraryShelf, UserFavorite } from "@/types";

export type LibrarySort =
  | "newest"
  | "title"
  | "year"
  | "rating";

export const LIBRARY_SORT_OPTIONS: ReadonlyArray<{
  value: LibrarySort;
  label: string;
}> = [
  { value: "newest", label: "Newest" },
  { value: "title", label: "Title A–Z" },
  { value: "year", label: "Year" },
  { value: "rating", label: "Highest rated" },
];

function parseYear(value: string): number {
  const match = value.match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

/**
 * Stable shelf activity time. Deliberately ignores `updatedAt` so rating/note
 * edits and Firestore resyncs do not reshuffle "Newest".
 */
function activityStamp(entry: UserFavorite, shelf: LibraryShelf): string {
  if (shelf === "watched") {
    return entry.watchedAt ?? entry.addedAt;
  }
  return entry.addedAt;
}

/** Case-insensitive title filter; blank query returns the list unchanged. */
export function filterLibraryEntries(
  entries: UserFavorite[],
  query: string,
): UserFavorite[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return entries;
  }

  return entries.filter((entry) =>
    entry.title.toLowerCase().includes(needle),
  );
}

/**
 * Deterministic sorts. Tie-breaks on imdbID so equal years / timestamps do not
 * jump around when Firestore snapshots arrive in a different order.
 */
export function sortLibraryBrowse(
  entries: UserFavorite[],
  sort: LibrarySort,
  shelf: LibraryShelf,
): UserFavorite[] {
  return [...entries].sort((a, b) => {
    let cmp = 0;

    switch (sort) {
      case "title":
        cmp = a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        });
        break;
      case "year":
        cmp = parseYear(b.year) - parseYear(a.year);
        break;
      case "rating": {
        const aRating = a.rating ?? -1;
        const bRating = b.rating ?? -1;
        cmp = bRating - aRating;
        break;
      }
      case "newest":
      default:
        cmp = activityStamp(b, shelf).localeCompare(activityStamp(a, shelf));
        break;
    }

    return cmp !== 0 ? cmp : a.imdbID.localeCompare(b.imdbID);
  });
}

export function browseLibraryEntries(
  entries: UserFavorite[],
  options: { query: string; sort: LibrarySort; shelf: LibraryShelf },
): UserFavorite[] {
  return sortLibraryBrowse(
    filterLibraryEntries(entries, options.query),
    options.sort,
    options.shelf,
  );
}

/**
 * Picks one entry at random. Pass a custom `random` in tests; production uses
 * Math.random.
 */
export function pickRandomLibraryEntry(
  entries: UserFavorite[],
  random: () => number = Math.random,
): UserFavorite | null {
  if (entries.length === 0) {
    return null;
  }

  const index = Math.floor(random() * entries.length);
  return entries[Math.min(index, entries.length - 1)] ?? null;
}
