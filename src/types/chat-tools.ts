export interface ChatMovieSearchItem {
  imdbID: string;
  title: string;
  year: string;
  poster: string;
  type: string;
}

export interface ChatMovieSearchOutput {
  query: string;
  results: ChatMovieSearchItem[];
  totalResults: number;
}

export interface ChatMovieDetailsOutput {
  imdbID: string;
  title: string;
  year: string;
  rated: string | null;
  runtime: string | null;
  genre: string | null;
  director: string | null;
  actors: string | null;
  plot: string | null;
  poster: string | null;
  imdbRating: string | null;
  rottenTomatoes: string | null;
  metascore: string | null;
}

export type ChatToolOutput = ChatMovieSearchOutput | ChatMovieDetailsOutput;

export type ChatToolName = "searchMovies" | "getMovieDetails";

export function isChatToolPartType(
  type: string,
): type is `tool-${ChatToolName}` {
  return type === "tool-searchMovies" || type === "tool-getMovieDetails";
}
