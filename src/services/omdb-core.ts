import type { Movie, SearchParams, SearchResponse } from "@/types";

export const OMDB_BASE_URL = "https://www.omdbapi.com/";
export const OMDB_REVALIDATE_SECONDS = 60 * 60 * 24;

export class OMDbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OMDbError";
  }
}

export function getOMDbErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof OMDbError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function getApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_OMDB_API_KEY;

  if (!apiKey) {
    throw new OMDbError(
      "Missing NEXT_PUBLIC_OMDB_API_KEY environment variable.",
    );
  }

  return apiKey;
}

export function buildOMDbUrl(params: Record<string, string>): string {
  const url = new URL(OMDB_BASE_URL);
  url.searchParams.set("apikey", getApiKey());

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

type OMDbPayload = {
  Response?: "True" | "False";
  Error?: string;
};

export function parseOMDbResponse<T extends OMDbPayload>(data: T): T {
  if (data.Response === "False") {
    throw new OMDbError(data.Error ?? "Unknown OMDb API error.");
  }

  return data;
}

export function normalizeSearchParams({
  query,
  page = 1,
  type = "movie",
}: SearchParams): SearchParams {
  return {
    query: query.trim(),
    page,
    type,
  };
}

export function emptySearchResponse(): SearchResponse {
  return { Response: "True", Search: [], totalResults: "0" };
}

export function movieToSearchResult(movie: Movie) {
  return {
    Title: movie.Title,
    Year: movie.Year,
    imdbID: movie.imdbID,
    Type: movie.Type,
    Poster: movie.Poster,
  };
}

export function isMovieNotFoundMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("movie not found") ||
    normalized.includes("invalid imdb") ||
    normalized.includes("imdb id")
  );
}

export function isTooManyResultsMessage(message: string): boolean {
  return message.toLowerCase().includes("too many results");
}
