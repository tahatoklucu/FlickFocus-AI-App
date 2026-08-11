import { tool } from "ai";
import { z } from "zod";
import { rankSearchResults } from "@/lib/chat/movie-search-utils";
import { getMovieById, searchMovies } from "@/services/omdb.server";
import {
  getOMDbErrorMessage,
  OMDbError,
} from "@/services/omdb-core";
import type {
  ChatMovieDetailsOutput,
  ChatMovieSearchOutput,
} from "@/types/chat-tools";

const MAX_SEARCH_RESULTS = 6;

function displayValue(value: string | undefined): string | null {
  if (!value || value === "N/A") {
    return null;
  }
  return value;
}

function getRating(movie: Awaited<ReturnType<typeof getMovieById>>, source: string) {
  return movie.Ratings?.find((entry) => entry.Source === source)?.Value ?? null;
}

export const searchMoviesTool = tool({
  description:
    "Search the OMDb catalog for movies by title, keyword, or partial name. Use when the user asks to find, look up, or discover movies.",
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .max(120)
      .describe("Movie title or search keywords, e.g. Inception or sci-fi space"),
  }),
  execute: async ({ query }): Promise<ChatMovieSearchOutput> => {
    try {
      const response = await searchMovies({ query, page: 1, type: "movie" });
      const rawResults = response.Search ?? [];

      if (rawResults.length === 0) {
        return {
          query,
          results: [],
          totalResults: 0,
        };
      }

      const ranked = rankSearchResults(rawResults, query).slice(0, MAX_SEARCH_RESULTS);
      const totalResults = Number.parseInt(response.totalResults ?? "0", 10);

      return {
        query,
        results: ranked.map((movie) => ({
          imdbID: movie.imdbID,
          title: movie.Title,
          year: movie.Year,
          poster: movie.Poster,
          type: movie.Type,
        })),
        totalResults: Number.isNaN(totalResults) ? ranked.length : totalResults,
      };
    } catch (error) {
      throw new Error(getOMDbErrorMessage(error, "Movie search failed."));
    }
  },
});

export const getMovieDetailsTool = tool({
  description:
    "Fetch detailed information and ratings for a specific movie by IMDb ID. Use after searchMovies or when the user asks for plot, cast, director, or ratings.",
  inputSchema: z.object({
    imdbID: z
      .string()
      .min(1)
      .max(20)
      .regex(/^tt\d{5,10}$/i, "Invalid IMDb ID format.")
      .describe("IMDb ID such as tt0133093 for The Matrix"),
  }),
  execute: async ({ imdbID }): Promise<ChatMovieDetailsOutput> => {
    try {
      const movie = await getMovieById(imdbID);

      return {
        imdbID: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        rated: displayValue(movie.Rated),
        runtime: displayValue(movie.Runtime),
        genre: displayValue(movie.Genre),
        director: displayValue(movie.Director),
        actors: displayValue(movie.Actors),
        plot: displayValue(movie.Plot),
        poster: displayValue(movie.Poster),
        imdbRating: displayValue(movie.imdbRating),
        rottenTomatoes: getRating(movie, "Rotten Tomatoes"),
        metascore: displayValue(movie.Metascore),
      };
    } catch (error) {
      if (error instanceof OMDbError) {
        throw new Error(error.message);
      }
      throw new Error(getOMDbErrorMessage(error, "Failed to load movie details."));
    }
  },
});

export const flickFocusChatTools = {
  searchMovies: searchMoviesTool,
  getMovieDetails: getMovieDetailsTool,
};
