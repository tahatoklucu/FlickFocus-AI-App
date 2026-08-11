import { FEATURED_MOVIE_IDS } from "@/constants/featuredMovies";
import type { MovieSearchResult } from "@/types";

const MAX_SEARCH_RESULTS = 10;

const featuredIdSet = new Set<string>(FEATURED_MOVIE_IDS);

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function getTitleScore(title: string, query: string): number {
  const normalizedTitle = normalize(title);
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return 0;
  }

  if (normalizedTitle === normalizedQuery) {
    return 100;
  }

  if (normalizedTitle.startsWith(normalizedQuery)) {
    return 80;
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    return 60;
  }

  return 0;
}

/** Prioritize featured picks and title relevance, then cap result count. */
export function rankSearchResults(
  results: MovieSearchResult[],
  query: string,
): MovieSearchResult[] {
  const normalizedQuery = normalize(query);

  return [...results]
    .sort((left, right) => {
      const leftFeatured = featuredIdSet.has(left.imdbID) ? 1 : 0;
      const rightFeatured = featuredIdSet.has(right.imdbID) ? 1 : 0;

      if (leftFeatured !== rightFeatured) {
        return rightFeatured - leftFeatured;
      }

      const leftScore = getTitleScore(left.Title, normalizedQuery);
      const rightScore = getTitleScore(right.Title, normalizedQuery);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      return left.Title.localeCompare(right.Title);
    })
    .slice(0, MAX_SEARCH_RESULTS);
}

/** Featured section fallback when search is too broad or returns nothing. */
export function getFeaturedFallbackResults(
  featured: MovieSearchResult[],
  query: string,
): MovieSearchResult[] {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return featured;
  }

  const matched = featured.filter(
    (movie) =>
      normalize(movie.Title).includes(normalizedQuery) ||
      movie.Year.includes(normalizedQuery),
  );

  return matched.length > 0 ? matched : featured;
}

export function isBroadSearchQuery(query: string): boolean {
  return normalize(query).length < 3;
}
