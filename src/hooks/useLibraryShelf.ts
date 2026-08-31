"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildLibraryShelfQuery,
  DEFAULT_LIBRARY_SHELF,
  parseLibraryShelf,
} from "@/lib/library-tabs";
import type { LibraryShelf } from "@/types";

/**
 * Keeps the active library tab in the URL so a shelf can be linked and the
 * back button moves between tabs. Hydrates after mount to keep the page static.
 */
export function useLibraryShelf(): readonly [
  LibraryShelf,
  (shelf: LibraryShelf) => void,
] {
  const [shelf, setShelf] = useState<LibraryShelf>(DEFAULT_LIBRARY_SHELF);

  useEffect(() => {
    function syncFromUrl() {
      setShelf(parseLibraryShelf(window.location.search));
    }

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const selectShelf = useCallback((next: LibraryShelf) => {
    setShelf(next);
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}${buildLibraryShelfQuery(next)}`,
    );
  }, []);

  return [shelf, selectShelf] as const;
}
