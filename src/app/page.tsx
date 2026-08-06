"use client";

import { useCallback, useState } from "react";
import MovieDetailModal from "@/components/MovieDetailModal";
import MovieList from "@/components/MovieList";
import SearchBar from "@/components/SearchBar";
import { OMDbError, searchMovies } from "@/services/omdb";
import type { MovieSearchResult } from "@/types";

export default function Home() {
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

  function handleMovieSelect(imdbID: string) {
    setSelectedMovieId(imdbID);
    setIsModalOpen(true);
  }

  async function handleSearch(query: string) {
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
      setError(
        err instanceof OMDbError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Movie Search
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Discover movies powered by the OMDb API
          </p>
        </header>

        <section className="mb-10">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </section>

        <section>
          <MovieList
            movies={movies}
            isLoading={isLoading}
            error={error}
            hasSearched={hasSearched}
            onMovieSelect={handleMovieSelect}
          />
        </section>
      </main>

      <MovieDetailModal
        imdbID={selectedMovieId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
