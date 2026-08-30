/** Normalized trailer video resolved from TMDB for an OMDb title. */
export interface MovieTrailer {
  /** YouTube video id used for the embed URL. */
  youtubeKey: string;
  name: string;
  type: "Trailer" | "Teaser" | "Clip" | "Featurette";
  official: boolean;
  publishedAt: string | null;
}

export interface MovieTrailerResponse {
  trailers: MovieTrailer[];
}
