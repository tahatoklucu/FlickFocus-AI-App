"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { buildLibraryShelfQuery, parseLibraryShelf } from "@/lib/library-tabs";
import type { LibraryShelf } from "@/types";

/**
 * Keeps the active library shelf in the URL so it can be linked from anywhere
 * (including the header menu) and the back button moves between shelves.
 */
export function useLibraryShelf(): readonly [
  LibraryShelf,
  (shelf: LibraryShelf) => void,
] {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shelf = parseLibraryShelf(searchParams.toString());

  const selectShelf = useCallback(
    (next: LibraryShelf) => {
      router.push(`/favorites${buildLibraryShelfQuery(next)}`, { scroll: false });
    },
    [router],
  );

  return [shelf, selectShelf] as const;
}
