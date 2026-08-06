import type { Movie, SearchParams, SearchResponse } from "@/types";
import {
  getOMDbErrorMessage,
  OMDbError,
} from "@/services/omdb-core";

export { getOMDbErrorMessage, OMDbError };

const movieCache = new Map<string, Movie>();
const searchCache = new Map<string, SearchResponse>();

function getSearchCacheKey({ query, page = 1, type = "movie" }: SearchParams) {
  return `${query.trim().toLowerCase()}::${page}::${type}`;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Something went wrong. Please try again.";

    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Use default message when error body is unavailable.
    }

    throw new OMDbError(message);
  }

  return (await response.json()) as T;
}

/** Client-side movie detail fetch with in-memory deduplication. */
export async function getMovieById(imdbID: string): Promise<Movie> {
  const trimmedId = imdbID.trim();

  if (!trimmedId) {
    throw new OMDbError("An IMDb ID is required.");
  }

  const cached = movieCache.get(trimmedId);
  if (cached) {
    return cached;
  }

  const response = await fetch(`/api/movies/${encodeURIComponent(trimmedId)}`, {
    method: "GET",
    cache: "force-cache",
  });

  const movie = await readJsonResponse<Movie>(response);
  movieCache.set(trimmedId, movie);
  return movie;
}

/** Client-side search fetch with in-memory deduplication. */
export async function searchMovies(params: SearchParams): Promise<SearchResponse> {
  const normalized = {
    query: params.query.trim(),
    page: params.page ?? 1,
    type: params.type ?? "movie",
  };

  if (!normalized.query) {
    return { Response: "True", Search: [], totalResults: "0" };
  }

  const cacheKey = getSearchCacheKey(normalized);
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const searchParams = new URLSearchParams({
    q: normalized.query,
    page: String(normalized.page),
    type: normalized.type,
  });

  const response = await fetch(`/api/movies/search?${searchParams.toString()}`, {
    method: "GET",
    cache: "force-cache",
  });

  const result = await readJsonResponse<SearchResponse>(response);
  searchCache.set(cacheKey, result);
  return result;
}
