const POSTER_HOST_PATTERN = /(^|\.)media-amazon\.com$/i;

/** Returns true when the OMDb poster URL is safe to pass to next/image. */
export function isValidPosterUrl(poster: string | undefined | null): boolean {
  if (!poster || poster === "N/A" || poster.trim().length === 0) {
    return false;
  }

  try {
    const url = new URL(poster);
    return url.protocol === "https:" && POSTER_HOST_PATTERN.test(url.hostname);
  } catch {
    return false;
  }
}
