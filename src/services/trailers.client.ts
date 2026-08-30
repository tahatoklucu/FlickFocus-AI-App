import type { MovieTrailer, MovieTrailerResponse } from "@/types";

const trailerCache = new Map<string, MovieTrailer[]>();

/** Client-side trailer fetch with in-memory deduplication per session. */
export async function getTrailersByImdbId(imdbID: string): Promise<MovieTrailer[]> {
  const trimmedId = imdbID.trim();

  if (!trimmedId) {
    return [];
  }

  const cached = trailerCache.get(trimmedId);
  if (cached) {
    return cached;
  }

  const response = await fetch(
    `/api/movies/${encodeURIComponent(trimmedId)}/trailer`,
    { method: "GET", cache: "force-cache" },
  );

  if (!response.ok) {
    throw new Error("Failed to load trailers.");
  }

  const payload = (await response.json()) as MovieTrailerResponse;
  const trailers = payload.trailers ?? [];
  trailerCache.set(trimmedId, trailers);
  return trailers;
}
