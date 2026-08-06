"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import MovieList from "@/components/MovieList";
import SearchBar from "@/components/SearchBar";
import { getOMDbErrorMessage, searchMovies } from "@/services/omdb";
import type { MovieSearchResult } from "@/types";

const MovieDetailModal = dynamic(
  () => import("@/components/MovieDetailModal"),
  { ssr: false },
);

interface HomePageClientProps {
  initialFeaturedMovies: MovieSearchResult[];
}

export default function HomePageClient({
  initialFeaturedMovies,
}: HomePageClientProps) {
  const [movies, setMovies] = useState<MovieSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
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

  const handleSearch = useCallback(async (query: string) => {
    if (!query) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await searchMovies({ query });
      setMovies(response.Search ?? []);
    } catch (err) {
      setMovies([]);
      setError(getOMDbErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <>
      <section className="mb-10">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </section>

      <section>
        {hasSearched ? (
          <MovieList
            movies={movies}
            isLoading={isLoading}
            error={error}
            hasSearched={hasSearched}
            onMovieSelect={handleMovieSelect}
            emptyTitle="No movies found"
            emptySubtitle="We couldn't find any matches in the OMDb catalog. Try a different title, director, or keyword."
          />
        ) : (
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
              error={
                initialFeaturedMovies.length === 0
                  ? "Unable to load featured movies right now."
                  : null
              }
              hasSearched
              onMovieSelect={handleMovieSelect}
              showInitialPrompt={false}
              priorityCount={5}
              emptyTitle="No featured movies available"
              emptySubtitle="We couldn't load the curated picks right now. Please refresh or try searching above."
              resultLabel={`${initialFeaturedMovies.length} featured movie${initialFeaturedMovies.length === 1 ? "" : "s"}`}
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
