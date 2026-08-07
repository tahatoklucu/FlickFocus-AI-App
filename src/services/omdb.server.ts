import "server-only";

import { cache } from "react";
import { FEATURED_MOVIE_IDS } from "@/constants/featuredMovies";
import type { Movie, MovieSearchResult, SearchParams, SearchResponse } from "@/types";
import {
  buildOMDbUrl,
  emptySearchResponse,
  movieToSearchResult,
  normalizeSearchParams,
  OMDB_REVALIDATE_SECONDS,
  OMDbError,
  parseOMDbResponse,
} from "@/services/omdb-core";

async function fetchFromOMDb<T extends { Response?: "True" | "False"; Error?: string }>(
  params: Record<string, string>,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(buildOMDbUrl(params), {
      next: { revalidate: OMDB_REVALIDATE_SECONDS },
    });
  } catch {
    throw new OMDbError("Failed to reach the OMDb API. Check your connection.");
  }

  if (!response.ok) {
    throw new OMDbError(
      `OMDb API request failed (${response.status}). Please try again.`,
    );
  }

  let data: T;

  try {
    data = (await response.json()) as T;
  } catch {
    throw new OMDbError("Received an invalid response from the OMDb API.");
  }

  return parseOMDbResponse(data);
}

export const getMovieById = cache(async (imdbID: string): Promise<Movie> => {
  const trimmedId = imdbID.trim();

  if (!trimmedId) {
    throw new OMDbError("An IMDb ID is required.");
  }

  return fetchFromOMDb<Movie>({
    i: trimmedId,
    plot: "full",
  });
});

export const searchMovies = cache(
  async (params: SearchParams): Promise<SearchResponse> => {
    const { query, page, type } = normalizeSearchParams(params);

    if (!query) {
      return emptySearchResponse();
    }

    try {
      return await fetchFromOMDb<SearchResponse>({
        s: query,
        page: String(page),
        type: type ?? "movie",
      });
    } catch (error) {
      if (
        error instanceof OMDbError &&
        (error.message === "Movie not found!" ||
          error.message === "Too many results.")
      ) {
        return emptySearchResponse();
      }
      throw error;
    }
  },
);

export const getFeaturedMovies = cache(
  async (): Promise<MovieSearchResult[]> => {
    const results = await Promise.allSettled(
      FEATURED_MOVIE_IDS.map((imdbID) => getMovieById(imdbID)),
    );

    return results
      .filter(
        (result): result is PromiseFulfilledResult<Movie> =>
          result.status === "fulfilled",
      )
      .map((result) => movieToSearchResult(result.value));
  },
);
