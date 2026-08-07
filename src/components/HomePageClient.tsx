"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import MovieList from "@/components/MovieList";
import SearchBar from "@/components/SearchBar";
import {
  getFeaturedFallbackResults,
  isBroadSearchQuery,
  rankSearchResults,
} from "@/lib/movie-search-utils";
import { searchMovies } from "@/services/omdb";
import type { MovieSearchResult } from "@/types";

const MovieDetailModal = dynamic(
  () => import("@/components/MovieDetailModal"),
  { ssr: false },
);

interface HomePageClientProps {
  initialFeaturedMovies: MovieSearchResult[];
}

type SearchView = "featured" | "results" | "picks";

export default function HomePageClient({
  initialFeaturedMovies,
}: HomePageClientProps) {
  const [movies, setMovies] = useState<MovieSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchView, setSearchView] = useState<SearchView>("featured");
  const [resultLabel, setResultLabel] = useState<string | undefined>();
  const [listSubtitle, setListSubtitle] = useState<string | undefined>();
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedMovieId(null);
  }, []);

  const handleMovieSelect = useCallback((imdbID: string) => {
    setSelectedMovieId(imdbID);
    setIsModalOpen(true);
  }, []);

  const resetToFeatured = useCallback(() => {
    setMovies([]);
    setSearchView("featured");
    setResultLabel(undefined);
    setListSubtitle(undefined);
    setIsLoading(false);
  }, []);

  const showFeaturedPicks = useCallback(
    (query: string, reason: "broad" | "empty" | "error") => {
      const picks = getFeaturedFallbackResults(initialFeaturedMovies, query);
      setMovies(picks);
      setSearchView("picks");
      setResultLabel(`${picks.length} top pick${picks.length === 1 ? "" : "s"}`);

      if (reason === "broad") {
        setListSubtitle("Try at least 3 characters for a more specific search.");
      } else if (reason === "empty") {
        setListSubtitle("No exact matches — here are some featured classics.");
      } else {
        setListSubtitle("Showing featured picks while search is unavailable.");
      }
    },
    [initialFeaturedMovies],
  );

  const handleSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();

      if (!trimmed) {
        resetToFeatured();
        return;
      }

      if (isBroadSearchQuery(trimmed)) {
        showFeaturedPicks(trimmed, "broad");
        return;
      }

      setIsLoading(true);
      setListSubtitle(undefined);

      try {
        const response = await searchMovies({ query: trimmed });
        const results = response.Search ?? [];

        if (results.length === 0) {
          showFeaturedPicks(trimmed, "empty");
          return;
        }

        const ranked = rankSearchResults(results, trimmed);
        setMovies(ranked);
        setSearchView("results");
        setResultLabel(
          `${ranked.length} result${ranked.length === 1 ? "" : "s"} found`,
        );
      } catch {
        showFeaturedPicks(trimmed, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [resetToFeatured, showFeaturedPicks],
  );

  const isFeaturedView = searchView === "featured";

  return (
    <>
      <section className="mb-6 sm:mb-10">
        <SearchBar
          onSearch={handleSearch}
          onClear={resetToFeatured}
          isLoading={isLoading}
        />
      </section>

      <section>
        {isFeaturedView ? (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Featured Movies
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Popular classics to get you started — or search above for
                anything else
              </p>
            </div>
            <MovieList
              movies={initialFeaturedMovies}
              isLoading={false}
              error={null}
              hasSearched
              onMovieSelect={handleMovieSelect}
              showInitialPrompt={false}
              priorityCount={5}
              emptyTitle="No featured movies available"
              emptySubtitle="We couldn't load the curated picks right now. Please refresh or try searching above."
              resultLabel={`${initialFeaturedMovies.length} featured movie${initialFeaturedMovies.length === 1 ? "" : "s"}`}
            />
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {searchView === "results" ? "Search Results" : "Top Picks"}
              </h2>
              {listSubtitle ? (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {listSubtitle}
                </p>
              ) : null}
            </div>
            <MovieList
              movies={movies}
              isLoading={isLoading}
              error={null}
              hasSearched
              onMovieSelect={handleMovieSelect}
              priorityCount={6}
              resultLabel={resultLabel}
              emptyTitle="No movies found"
              emptySubtitle="Try a different title, director, or keyword."
            />
          </div>
        )}
      </section>

      <MovieDetailModal
        imdbID={selectedMovieId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
