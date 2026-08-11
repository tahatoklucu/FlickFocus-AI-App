const availabilityCache = new Map<string, boolean>();

export async function checkPosterAvailability(poster: string): Promise<boolean> {
  const cached = availabilityCache.get(poster);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const response = await fetch(
      `/api/poster/availability?url=${encodeURIComponent(poster)}`,
    );

    if (!response.ok) {
      availabilityCache.set(poster, false);
      return false;
    }

    const data = (await response.json()) as { available?: boolean };
    const available = data.available === true;
    availabilityCache.set(poster, available);
    return available;
  } catch {
    availabilityCache.set(poster, false);
    return false;
  }
}

/** @internal Test helper */
export function resetPosterAvailabilityCache() {
  availabilityCache.clear();
}
