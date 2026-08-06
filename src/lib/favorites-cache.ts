import type { UserFavorite } from "@/types";

const CACHE_PREFIX = "flickfocus:favorites:";

function cacheKey(userId: string) {
  return `${CACHE_PREFIX}${userId}`;
}

export function readFavoritesCache(userId: string): UserFavorite[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as UserFavorite[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeFavoritesCache(
  userId: string,
  favorites: UserFavorite[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(favorites));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function clearFavoritesCache(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(cacheKey(userId));
}
