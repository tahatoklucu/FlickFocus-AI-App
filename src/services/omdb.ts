import type { Movie, SearchParams, SearchResponse } from "@/types";

const OMDB_BASE_URL = "https://www.omdbapi.com/";

export class OMDbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OMDbError";
  }
}

function getApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_OMDB_API_KEY;

  if (!apiKey) {
    throw new OMDbError(
      "Missing NEXT_PUBLIC_OMDB_API_KEY environment variable.",
    );
  }

  return apiKey;
}

async function fetchFromOMDb<T>(
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(OMDB_BASE_URL);
  url.searchParams.set("apikey", getApiKey());

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  let response: Response;

  try {
    response = await fetch(url.toString());
  } catch {
    throw new OMDbError("Failed to reach the OMDb API. Check your connection.");
  }

  if (!response.ok) {
    throw new OMDbError(`OMDb API request failed (${response.status}).`);
  }

  const data = (await response.json()) as T & {
    Response?: "True" | "False";
    Error?: string;
  };

  if (data.Response === "False") {
    throw new OMDbError(data.Error ?? "Unknown OMDb API error.");
  }

  return data;
}

/** Search movies by title. Returns an empty array when no results are found. */
export async function searchMovies({
  query,
  page = 1,
  type = "movie",
}: SearchParams): Promise<SearchResponse> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { Response: "True", Search: [], totalResults: "0" };
  }

  try {
    return await fetchFromOMDb<SearchResponse>({
      s: trimmedQuery,
      page: String(page),
      type,
    });
  } catch (error) {
    if (error instanceof OMDbError && error.message === "Movie not found!") {
      return { Response: "True", Search: [], totalResults: "0" };
    }
    throw error;
  }
}

/** Fetch full movie details by IMDb ID. */
export async function getMovieById(imdbID: string): Promise<Movie> {
  const trimmedId = imdbID.trim();

  if (!trimmedId) {
    throw new OMDbError("An IMDb ID is required.");
  }

  return fetchFromOMDb<Movie>({
    i: trimmedId,
    plot: "full",
  });
}
