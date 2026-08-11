import { isValidPosterUrl } from "@/lib/poster-url";

const POSTER_CHECK_TIMEOUT_MS = 8000;

/** Server-side probe — avoids client 404 console noise for broken OMDb posters. */
export async function isPosterAvailable(url: string): Promise<boolean> {
  if (!isValidPosterUrl(url)) {
    return false;
  }

  try {
    const headResponse = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(POSTER_CHECK_TIMEOUT_MS),
      headers: { Accept: "image/*" },
      next: { revalidate: 86_400 },
    });

    if (headResponse.ok) {
      return true;
    }

    if (headResponse.status === 404 || headResponse.status === 410) {
      return false;
    }

    const getResponse = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(POSTER_CHECK_TIMEOUT_MS),
      headers: { Accept: "image/*" },
      next: { revalidate: 86_400 },
    });

    return getResponse.ok;
  } catch {
    return false;
  }
}
