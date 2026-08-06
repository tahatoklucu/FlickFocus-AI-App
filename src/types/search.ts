import type { MovieSearchResult } from "./movie";

/** OMDb search API response (`s=` query parameter). */
export interface SearchResponse {
  Search?: MovieSearchResult[];
  totalResults?: string;
  Response: "True" | "False";
  Error?: string;
}

/** Parameters accepted by the movie search function. */
export interface SearchParams {
  query: string;
  page?: number;
  type?: "movie" | "series" | "episode";
}
