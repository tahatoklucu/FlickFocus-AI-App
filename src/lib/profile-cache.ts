import type { UserProfile } from "@/types/user";

const CACHE_PREFIX = "flickfocus-profile:";

function cacheKey(uid: string): string {
  return `${CACHE_PREFIX}${uid}`;
}

export function readProfileCache(uid: string): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(cacheKey(uid));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as UserProfile;
    if (parsed.uid !== uid) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeProfileCache(profile: UserProfile): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(cacheKey(profile.uid), JSON.stringify(profile));
  } catch {
    // Ignore quota errors; cloud sync may still succeed.
  }
}

export function clearProfileCache(uid: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(cacheKey(uid));
}
