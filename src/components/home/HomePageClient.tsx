"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import MovieList from "@/components/movies/MovieList";
import SearchBar from "@/components/movies/SearchBar";
import SearchPagination from "@/components/movies/SearchPagination";
import {
  GENRE_CHIPS,
  getGenreChipLabel,
  type GenreChipId,
} from "@/constants/genreChips";
import { useHomeSearchUrlState } from "@/hooks/useHomeSearchUrlState";
import { describeGenreCatalog } from "@/lib/genre-filter";
import {
  getHomeSearchKey,
  getTotalPages,
  homeSearchNeedsFetch,
  type HomeSearchState,
} from "@/lib/home-search-params";
import {
  getFeaturedFallbackResults,
  isBroadSearchQuery,
  rankSearchResults,
} from "@/lib/chat/movie-search-utils";
import { cn } from "@/lib/cn";
import { getGenreMovies, getOMDbErrorMessage, searchMovies } from "@/services/omdb";
import type { FeaturedMovie, MovieSearchResult } from "@/types";

const MovieDetailModal = dynamic(
  () => import("@/components/movies/MovieDetailModal"),
  { ssr: false },
);

interface HomePageClientProps {
  initialFeaturedMovies: FeaturedMovie[];
}

type SearchView = "featured" | "genre" | "results" | "picks";

/** Fetched payload tagged with the URL state it belongs to. */
interface LoadedResults {
  key: string;
  view: Extract<SearchView, "genre" | "results" | "picks">;
  movies: MovieSearchResult[];
  totalResults: number;
  resultLabel?: string;
  subtitle?: string;
}

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
}: HomePageClientProps) {
  const resultsRef = useRef<HTMLElement>(null);
  /** First desktop row (5 cols) — covers Lighthouse LCP (often Interstellar @ index 2). */
  const posterPriorityCount = 5;
  const [urlState, navigate] = useHomeSearchUrlState();
  const [loaded, setLoaded] = useState<LoadedResults | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [syncedQuery, setSyncedQuery] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** Only scroll when the user acts, never when a shared URL is restored. */
  const shouldScrollRef = useRef(false);
  /** Last known match count, so deep pages keep a working pager. */
  const loadedTotalForQueryRef = useRef(0);

  // Back/forward changes the URL, so pull the text back into the input.
  if (syncedQuery !== urlState.query) {
    setSyncedQuery(urlState.query);
    setInputValue(urlState.query);
  }

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const consumePendingScroll = useCallback(() => {
    if (!shouldScrollRef.current) {
      return;
    }
    shouldScrollRef.current = false;
    scrollToResults();
  }, [scrollToResults]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedMovieId(null);
  }, []);

  const handleMovieSelect = useCallback((imdbID: string) => {
    setSelectedMovieId(imdbID);
    setIsModalOpen(true);
  }, []);

  const buildFallbackPicks = useCallback(
    (key: string, query: string, reason: "empty" | "error"): LoadedResults => {
      const picks = getFeaturedFallbackResults(initialFeaturedMovies, query);
      return {
        key,
        view: "picks",
        movies: picks,
        totalResults: 0,
        resultLabel: `${picks.length} top pick${picks.length === 1 ? "" : "s"}`,
        subtitle:
          reason === "empty"
            ? "No exact matches — here are some featured classics."
            : "Showing featured picks while search is unavailable.",
      };
    },
    [initialFeaturedMovies],
  );

  useEffect(() => {
    if (!homeSearchNeedsFetch(urlState)) {
      return;
    }

    const { query, page, genre } = urlState;
    const key = getHomeSearchKey(urlState);
    let cancelled = false;

    function commit(results: LoadedResults) {
      if (cancelled) {
        return;
      }
      setLoaded(results);
      consumePendingScroll();
    }

    if (genre) {
      const label = getGenreChipLabel(genre);

      getGenreMovies(genre)
        .then((genreMovies) => {
          commit({
            key,
            view: "genre",
            movies: genreMovies,
            totalResults: 0,
            resultLabel: `${genreMovies.length} popular ${label.toLowerCase()} film${genreMovies.length === 1 ? "" : "s"}`,
            subtitle: describeGenreCatalog(genre),
          });
        })
        .catch((error: unknown) => {
          commit({
            key,
            view: "genre",
            movies: [],
            totalResults: 0,
            subtitle: getOMDbErrorMessage(
              error,
              "Couldn't load genre picks. Please try again.",
            ),
          });
        });

      return () => {
        cancelled = true;
      };
    }

    searchMovies({ query, page })
      .then((response) => {
        const results = response.Search ?? [];
        const total = Number.parseInt(response.totalResults ?? "0", 10) || 0;

        if (results.length === 0) {
          if (page > 1) {
            commit({
              key,
              view: "results",
              movies: [],
              // Keep the pager usable so the reader can step back.
              totalResults: loadedTotalForQueryRef.current,
              subtitle: "No more results on this page.",
            });
            return;
          }

          commit(buildFallbackPicks(key, query, "empty"));
          return;
        }

        loadedTotalForQueryRef.current = total;
        commit({
          key,
          view: "results",
          movies: rankSearchResults(results, query),
          totalResults: total,
          resultLabel: `${total.toLocaleString("en-US")} result${total === 1 ? "" : "s"} found`,
        });
      })
      .catch(() => {
        commit(buildFallbackPicks(key, query, "error"));
      });

    return () => {
      cancelled = true;
    };
  }, [urlState, buildFallbackPicks, consumePendingScroll]);

  const goTo = useCallback(
    (next: HomeSearchState, options?: { scroll?: boolean }) => {
      const wantsScroll = options?.scroll !== false;

      if (next.query !== urlState.query) {
        loadedTotalForQueryRef.current = 0;
      }

      if (wantsScroll) {
        if (homeSearchNeedsFetch(next)) {
          // Scroll once the results land, to avoid jumping to a skeleton.
          shouldScrollRef.current = true;
        } else {
          requestAnimationFrame(scrollToResults);
        }
      }

      navigate(next);
    },
    [navigate, scrollToResults, urlState.query],
  );

  const handleSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      goTo({ query: trimmed, page: 1, genre: null }, { scroll: Boolean(trimmed) });
    },
    [goTo],
  );

  const handleGenreSelect = useCallback(
    (genreId: GenreChipId) => {
      goTo({ query: "", page: 1, genre: genreId });
    },
    [goTo],
  );

  const handleClear = useCallback(() => {
    goTo({ query: "", page: 1, genre: null }, { scroll: false });
  }, [goTo]);

  const handlePageChange = useCallback(
    (page: number) => {
      goTo({ query: urlState.query, page, genre: null });
    },
    [goTo, urlState.query],
  );

  const activeKey = getHomeSearchKey(urlState);
  const currentResults = loaded?.key === activeKey ? loaded : null;
  const isBroadQuery = Boolean(urlState.query) && isBroadSearchQuery(urlState.query);
  const isLoading = homeSearchNeedsFetch(urlState) && currentResults === null;

  let searchView: SearchView;
  if (!urlState.query && !urlState.genre) {
    searchView = "featured";
  } else if (isBroadQuery) {
    searchView = "picks";
  } else if (currentResults) {
    searchView = currentResults.view;
  } else {
    searchView = urlState.genre ? "genre" : "results";
  }

  const broadPicks = isBroadQuery
    ? getFeaturedFallbackResults(initialFeaturedMovies, urlState.query)
    : null;

  const movies = broadPicks ?? currentResults?.movies ?? [];
  const resultLabel = broadPicks
    ? `${broadPicks.length} top pick${broadPicks.length === 1 ? "" : "s"}`
    : currentResults?.resultLabel;
  const listSubtitle = broadPicks
    ? "Try at least 3 characters for a more specific search."
    : isLoading && urlState.genre
      ? describeGenreCatalog(urlState.genre)
      : currentResults?.subtitle;

  const genreLabel = urlState.genre ? getGenreChipLabel(urlState.genre) : null;
  const totalPages = getTotalPages(currentResults?.totalResults ?? 0);

  return (
    <>
      <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-14">
        <section>
          <SearchBar
            query={inputValue}
            onQueryChange={setInputValue}
            onSearch={handleSearch}
            onClear={handleClear}
            isLoading={isLoading}
          />
          <div className="mt-4 flex flex-wrap justify-start gap-2">
            {GENRE_CHIPS.map((genre) => (
              <MemoizedGenreChip
                key={genre.id}
                label={genre.label}
                active={urlState.genre === genre.id}
                onClick={() => handleGenreSelect(genre.id)}
              />
            ))}
          </div>
        </section>
      </div>

      <section ref={resultsRef} className="scroll-mt-24">
        {searchView === "featured" ? (
          <div>
            <div className="mb-6">
              <div className="mb-2">
                <SectionBadge>Editor&apos;s picks</SectionBadge>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-50 sm:text-2xl">
                Featured Movies
              </h2>
              <p className="mt-1 max-w-lg text-sm text-neutral-400">
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
                <p className="mt-1 text-sm text-neutral-400">{listSubtitle}</p>
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

            {searchView === "results" && (
              <SearchPagination
                page={urlState.page}
                totalPages={totalPages}
                totalResults={currentResults?.totalResults ?? 0}
                isLoading={isLoading}
                onPageChange={handlePageChange}
              />
            )}
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
