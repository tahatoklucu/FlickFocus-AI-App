import type { GenreChipId } from "@/constants/genreChips";
import type { FeaturedMovie } from "@/types";

const CLASSIC_CUTOFF_YEAR = 2001;

function parseGenres(genre: string): string[] {
  return genre
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function hasGenre(movie: FeaturedMovie, genre: string): boolean {
  const normalized = genre.trim().toLowerCase();
  return parseGenres(movie.Genre).includes(normalized);
}

function isClassic(movie: FeaturedMovie): boolean {
  const year = Number.parseInt(movie.Year, 10);
  return !Number.isNaN(year) && year <= CLASSIC_CUTOFF_YEAR;
}

function isEpic(movie: FeaturedMovie): boolean {
  return (
    hasGenre(movie, "Fantasy") ||
    (hasGenre(movie, "Adventure") && hasGenre(movie, "Drama"))
  );
}

/** Filter curated featured movies using OMDb genre metadata (not title search). */
export function filterMoviesByGenre(
  movies: FeaturedMovie[],
  genreId: GenreChipId,
): FeaturedMovie[] {
  switch (genreId) {
    case "classics":
      return movies.filter(isClassic);
    case "sci-fi":
      return movies.filter((movie) => hasGenre(movie, "Sci-Fi"));
    case "action":
      return movies.filter((movie) => hasGenre(movie, "Action"));
    case "drama":
      return movies.filter((movie) => hasGenre(movie, "Drama"));
    case "epic":
      return movies.filter(isEpic);
    default:
      return movies;
  }
}

export function describeGenreFilter(genreId: GenreChipId): string {
  switch (genreId) {
    case "classics":
      return "Films from 2001 and earlier in our curated picks";
    case "sci-fi":
      return "Films tagged with Sci-Fi on OMDb";
    case "action":
      return "Films tagged with Action on OMDb";
    case "drama":
      return "Films tagged with Drama on OMDb";
    case "epic":
      return "Large-scale Adventure & Drama or Fantasy epics";
    default:
      return "Filtered from our curated picks";
  }
}

export function describeGenreCatalog(genreId: GenreChipId): string {
  switch (genreId) {
    case "classics":
      return "Top classic films verified by release year on OMDb";
    case "sci-fi":
      return "Top 10 popular Sci-Fi films from OMDb";
    case "action":
      return "Top 10 popular Action films from OMDb";
    case "drama":
      return "Top 10 popular Drama films from OMDb";
    case "epic":
      return "Top 10 epic-scale Adventure, Fantasy & Drama films from OMDb";
    default:
      return "Popular picks from OMDb";
  }
}
