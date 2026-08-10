/** OMDb rating entry (e.g. Internet Movie Database, Rotten Tomatoes). */
export interface MovieRating {
  Source: string;
  Value: string;
}

/** Full movie details returned by OMDb `i=` (by IMDb ID) requests. */
export interface Movie {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: MovieRating[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: "True" | "False";
  Error?: string;
}

/** Single item in an OMDb search result list. */
export interface MovieSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

/** Featured catalog entry with OMDb genre metadata for local filtering. */
export interface FeaturedMovie extends MovieSearchResult {
  Genre: string;
}
