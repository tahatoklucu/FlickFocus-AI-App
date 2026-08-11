"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useRef, useState, type ReactNode } from "react";
import MovieList from "@/components/MovieList";
import SearchBar from "@/components/SearchBar";
import {
  GENRE_CHIPS,
  getGenreChipLabel,
  type GenreChipId,
} from "@/constants/genreChips";
import {
  describeGenreCatalog,
} from "@/lib/genre-filter";
import {
  getFeaturedFallbackResults,
  isBroadSearchQuery,
  rankSearchResults,
} from "@/lib/movie-search-utils";
import { cn } from "@/lib/cn";
import { getGenreMovies, getOMDbErrorMessage, searchMovies } from "@/services/omdb";
import type { FeaturedMovie, MovieSearchResult } from "@/types";

const MovieDetailModal = dynamic(
  () => import("@/components/MovieDetailModal"),
  { ssr: false },
);

interface HomePageClientProps {
  initialFeaturedMovies: FeaturedMovie[];
  children?: ReactNode;
}

type SearchView = "featured" | "genre" | "results" | "picks";

function SectionBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300">
      {children}
    </span>
  );
}

function GenreChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
        active
          ? "border-violet-400/40 bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/30"
          : "border-neutral-800 bg-neutral-900/60 text-neutral-400 ring-1 ring-neutral-800/80 hover:border-neutral-600 hover:bg-neutral-800/80 hover:text-neutral-200",
      )}
    >
      {label}
    </button>
  );
}

const MemoizedGenreChip = memo(GenreChip);

export default function HomePageClient({
  initialFeaturedMovies,
  children,
}: HomePageClientProps) {
  const resultsRef = useRef<HTMLElement>(null);
  const posterPriorityCount = 0;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState<GenreChipId | null>(null);
  const [movies, setMovies] = useState<MovieSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchView, setSearchView] = useState<SearchView>("featured");
  const [resultLabel, setResultLabel] = useState<string | undefined>();
  const [listSubtitle, setListSubtitle] = useState<string | undefined>();
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
    setActiveGenre(null);
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

      setActiveGenre(null);

      if (isBroadSearchQuery(trimmed)) {
        showFeaturedPicks(trimmed, "broad");
        scrollToResults();
        return;
      }

      setIsLoading(true);
      setListSubtitle(undefined);

      try {
        const response = await searchMovies({ query: trimmed });
        const results = response.Search ?? [];

        if (results.length === 0) {
          showFeaturedPicks(trimmed, "empty");
          scrollToResults();
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
        scrollToResults();
      }
    },
    [resetToFeatured, scrollToResults, showFeaturedPicks],
  );

  const handleGenreSelect = useCallback(
    async (genreId: GenreChipId) => {
      const label = getGenreChipLabel(genreId);

      setSearchQuery("");
      setActiveGenre(genreId);
      setSearchView("genre");
      setIsLoading(true);
      setListSubtitle(describeGenreCatalog(genreId));
      scrollToResults();

      try {
        const genreMovies = await getGenreMovies(genreId);
        setMovies(genreMovies);
        setResultLabel(
          `${genreMovies.length} popular ${label.toLowerCase()} film${genreMovies.length === 1 ? "" : "s"}`,
        );
      } catch (error) {
        setMovies([]);
        setResultLabel(undefined);
        setListSubtitle(
          getOMDbErrorMessage(error, "Couldn't load genre picks. Please try again."),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [scrollToResults],
  );

  const handleQueryChange = useCallback((query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setActiveGenre(null);
    }
  }, []);

  const isFeaturedView = searchView === "featured";
  const genreLabel = activeGenre ? getGenreChipLabel(activeGenre) : null;

  return (
    <>
      <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-14">
        {children}
        <section>
          <SearchBar
            query={searchQuery}
            onQueryChange={handleQueryChange}
            onSearch={handleSearch}
            onClear={resetToFeatured}
            isLoading={isLoading}
          />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {GENRE_CHIPS.map((genre) => (
              <MemoizedGenreChip
                key={genre.id}
                label={genre.label}
                active={activeGenre === genre.id}
                onClick={() => handleGenreSelect(genre.id)}
              />
            ))}
          </div>
        </section>
      </div>

      <section ref={resultsRef} className="scroll-mt-24">
        {isFeaturedView ? (
          <div>
            <div className="mb-6">
              <div className="mb-2">
                <SectionBadge>Editor&apos;s picks</SectionBadge>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-50 sm:text-2xl">
                Featured Movies
              </h2>
              <p className="mt-1 max-w-lg text-sm text-neutral-500">
                Hand-picked classics to get you started — tap a genre or search
                above
              </p>
            </div>
            <MovieList
              movies={initialFeaturedMovies}
              isLoading={false}
              error={null}
              hasSearched
              onMovieSelect={handleMovieSelect}
              showInitialPrompt={false}
              priorityCount={posterPriorityCount}
              hideResultLabel
              emptyTitle="No featured movies available"
              emptySubtitle="We couldn't load the curated picks right now. Please refresh or try searching above."
            />
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="mb-2">
                <SectionBadge>
                  {searchView === "genre"
                    ? "Genre"
                    : searchView === "results"
                      ? "Search"
                      : "Suggestions"}
                </SectionBadge>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-50 sm:text-2xl">
                {searchView === "genre" && genreLabel
                  ? `${genreLabel} Movies`
                  : searchView === "results"
                    ? "Search Results"
                    : "Top Picks"}
              </h2>
              {listSubtitle ? (
                <p className="mt-1 text-sm text-neutral-500">{listSubtitle}</p>
              ) : null}
            </div>
            <MovieList
              movies={movies}
              isLoading={isLoading}
              error={null}
              hasSearched
              onMovieSelect={handleMovieSelect}
              priorityCount={posterPriorityCount}
              resultLabel={resultLabel}
              emptyTitle={
                searchView === "genre"
                  ? `No ${genreLabel?.toLowerCase() ?? "genre"} films in our picks`
                  : "No movies found"
              }
              emptySubtitle={
                searchView === "genre"
                  ? "Try another genre or search the full OMDb catalog above."
                  : "Try a different title, director, or keyword."
              }
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
