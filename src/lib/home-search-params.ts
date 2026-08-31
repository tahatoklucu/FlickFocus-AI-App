import { API_LIMITS, clampSearchQuery } from "@/lib/api/api-limits";
import { isBroadSearchQuery } from "@/lib/chat/movie-search-utils";
import { GENRE_CHIPS, type GenreChipId } from "@/constants/genreChips";

/** Discovery state that lives in the URL so searches are shareable. */
export interface HomeSearchState {
  query: string;
  page: number;
  genre: GenreChipId | null;
}

export const EMPTY_HOME_SEARCH_STATE: HomeSearchState = {
  query: "",
  page: 1,
  genre: null,
};

function parseGenre(value: string | null): GenreChipId | null {
  if (!value) {
    return null;
  }
  const match = GENRE_CHIPS.find((chip) => chip.id === value.toLowerCase());
  return match ? match.id : null;
}

function parsePage(value: string | null): number {
  const page = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }
  return Math.min(page, API_LIMITS.search.maxPage);
}

/**
 * Reads discovery state from a query string. A query always wins over a genre
 * so the two views can never be requested at the same time.
 */
export function parseHomeSearchParams(search: string): HomeSearchState {
  const params = new URLSearchParams(search);
  const query = clampSearchQuery(params.get("q") ?? "");

  if (query) {
    return { query, page: parsePage(params.get("page")), genre: null };
  }

  return { query: "", page: 1, genre: parseGenre(params.get("genre")) };
}

/** Serializes state back to a query string, omitting defaults for clean URLs. */
export function buildHomeSearchQuery(state: HomeSearchState): string {
  const params = new URLSearchParams();

  if (state.query) {
    params.set("q", state.query);
    if (state.page > 1) {
      params.set("page", String(state.page));
    }
  } else if (state.genre) {
    params.set("genre", state.genre);
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function isSameHomeSearchState(
  a: HomeSearchState,
  b: HomeSearchState,
): boolean {
  return a.query === b.query && a.page === b.page && a.genre === b.genre;
}

/** Identifies the payload a given URL state expects, for cache matching. */
export function getHomeSearchKey(state: HomeSearchState): string {
  if (state.query) {
    return `q:${state.query.toLowerCase()}:${state.page}`;
  }
  if (state.genre) {
    return `genre:${state.genre}`;
  }
  return "featured";
}

/**
 * True when the state can only be satisfied by a network request. Featured and
 * too-broad queries are answered locally from the prerendered picks.
 */
export function homeSearchNeedsFetch(state: HomeSearchState): boolean {
  if (state.genre) {
    return true;
  }
  return Boolean(state.query) && !isBroadSearchQuery(state.query);
}

/** OMDb serves 10 results per page and caps how deep we may paginate. */
export const RESULTS_PER_PAGE = 10;

export function getTotalPages(totalResults: number): number {
  if (totalResults <= 0) {
    return 0;
  }
  return Math.min(
    Math.ceil(totalResults / RESULTS_PER_PAGE),
    API_LIMITS.search.maxPage,
  );
}
