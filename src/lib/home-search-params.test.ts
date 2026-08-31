import { describe, expect, it } from "vitest";
import { API_LIMITS } from "@/lib/api/api-limits";
import {
  buildHomeSearchQuery,
  getHomeSearchKey,
  getTotalPages,
  homeSearchNeedsFetch,
  parseHomeSearchParams,
} from "@/lib/home-search-params";

describe("parseHomeSearchParams", () => {
  it("reads query and page", () => {
    expect(parseHomeSearchParams("?q=inception&page=2")).toEqual({
      query: "inception",
      page: 2,
      genre: null,
    });
  });

  it("clamps page to the API cap and rejects junk", () => {
    expect(parseHomeSearchParams("?q=dune&page=99").page).toBe(
      API_LIMITS.search.maxPage,
    );
    expect(parseHomeSearchParams("?q=dune&page=abc").page).toBe(1);
    expect(parseHomeSearchParams("?q=dune&page=-3").page).toBe(1);
  });

  it("accepts known genres only", () => {
    expect(parseHomeSearchParams("?genre=sci-fi").genre).toBe("sci-fi");
    expect(parseHomeSearchParams("?genre=polka").genre).toBeNull();
  });

  it("lets a query win over a genre", () => {
    expect(parseHomeSearchParams("?q=alien&genre=action")).toEqual({
      query: "alien",
      page: 1,
      genre: null,
    });
  });

  it("returns empty state for a bare url", () => {
    expect(parseHomeSearchParams("")).toEqual({ query: "", page: 1, genre: null });
  });
});

describe("buildHomeSearchQuery", () => {
  it("omits defaults", () => {
    expect(buildHomeSearchQuery({ query: "dune", page: 1, genre: null })).toBe("?q=dune");
    expect(buildHomeSearchQuery({ query: "", page: 1, genre: null })).toBe("");
  });

  it("round-trips query, page, and genre", () => {
    for (const state of [
      { query: "blade runner", page: 3, genre: null },
      { query: "", page: 1, genre: "drama" as const },
    ]) {
      expect(parseHomeSearchParams(buildHomeSearchQuery(state))).toEqual(state);
    }
  });
});

describe("getHomeSearchKey", () => {
  it("distinguishes pages, genres, and the default view", () => {
    expect(getHomeSearchKey({ query: "Dune", page: 2, genre: null })).toBe("q:dune:2");
    expect(getHomeSearchKey({ query: "dune", page: 1, genre: null })).toBe("q:dune:1");
    expect(getHomeSearchKey({ query: "", page: 1, genre: "epic" })).toBe("genre:epic");
    expect(getHomeSearchKey({ query: "", page: 1, genre: null })).toBe("featured");
  });
});

describe("homeSearchNeedsFetch", () => {
  it("skips the network for the default view and too-broad queries", () => {
    expect(homeSearchNeedsFetch({ query: "", page: 1, genre: null })).toBe(false);
    expect(homeSearchNeedsFetch({ query: "a", page: 1, genre: null })).toBe(false);
    expect(homeSearchNeedsFetch({ query: "inception", page: 1, genre: null })).toBe(true);
    expect(homeSearchNeedsFetch({ query: "", page: 1, genre: "action" })).toBe(true);
  });
});

describe("getTotalPages", () => {
  it("counts pages of ten and respects the cap", () => {
    expect(getTotalPages(0)).toBe(0);
    expect(getTotalPages(1)).toBe(1);
    expect(getTotalPages(25)).toBe(3);
    expect(getTotalPages(9999)).toBe(API_LIMITS.search.maxPage);
  });
});
