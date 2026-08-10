import { getMovieDetailsTool, searchMoviesTool } from "@/lib/chat-tools";
import { getMovieById, searchMovies } from "@/services/omdb.server";
import type { Movie } from "@/types";

vi.mock("@/services/omdb.server", () => ({
  searchMovies: vi.fn(),
  getMovieById: vi.fn(),
}));

const mockedSearchMovies = vi.mocked(searchMovies);
const mockedGetMovieById = vi.mocked(getMovieById);

const toolOptions = {
  toolCallId: "test-call",
  messages: [],
  context: {},
};

describe("searchMoviesTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps OMDb search results into chat output shape", async () => {
    mockedSearchMovies.mockResolvedValue({
      Response: "True",
      Search: [
        {
          Title: "Inception",
          Year: "2010",
          imdbID: "tt1375666",
          Type: "movie",
          Poster: "N/A",
        },
        {
          Title: "The Matrix",
          Year: "1999",
          imdbID: "tt0133093",
          Type: "movie",
          Poster: "N/A",
        },
      ],
      totalResults: "2",
    });

    const result = await searchMoviesTool.execute!(
      { query: "Inception" },
      toolOptions,
    );

    expect(mockedSearchMovies).toHaveBeenCalledWith({
      query: "Inception",
      page: 1,
      type: "movie",
    });
    expect(result).toEqual({
      query: "Inception",
      totalResults: 2,
      results: [
        {
          imdbID: "tt1375666",
          title: "Inception",
          year: "2010",
          poster: "N/A",
          type: "movie",
        },
        {
          imdbID: "tt0133093",
          title: "The Matrix",
          year: "1999",
          poster: "N/A",
          type: "movie",
        },
      ],
    });
  });

  it("returns empty results without calling external APIs beyond search", async () => {
    mockedSearchMovies.mockResolvedValue({
      Response: "True",
      Search: [],
      totalResults: "0",
    });

    const result = await searchMoviesTool.execute!(
      { query: "unknown-title-xyz" },
      toolOptions,
    );

    expect(result).toEqual({
      query: "unknown-title-xyz",
      results: [],
      totalResults: 0,
    });
    expect(mockedGetMovieById).not.toHaveBeenCalled();
  });
});

describe("getMovieDetailsTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps OMDb movie details into chat output shape", async () => {
    mockedGetMovieById.mockResolvedValue({
      Response: "True",
      imdbID: "tt1375666",
      Title: "Inception",
      Year: "2010",
      Rated: "PG-13",
      Runtime: "148 min",
      Genre: "Action, Sci-Fi",
      Director: "Christopher Nolan",
      Actors: "Leonardo DiCaprio",
      Plot: "Dream-sharing heist.",
      Poster: "N/A",
      imdbRating: "8.8",
      Metascore: "74",
      Ratings: [{ Source: "Rotten Tomatoes", Value: "87%" }],
    } as Movie);

    const result = await getMovieDetailsTool.execute!(
      { imdbID: "tt1375666" },
      toolOptions,
    );

    expect(mockedGetMovieById).toHaveBeenCalledWith("tt1375666");
    expect(result).toEqual({
      imdbID: "tt1375666",
      title: "Inception",
      year: "2010",
      rated: "PG-13",
      runtime: "148 min",
      genre: "Action, Sci-Fi",
      director: "Christopher Nolan",
      actors: "Leonardo DiCaprio",
      plot: "Dream-sharing heist.",
      poster: null,
      imdbRating: "8.8",
      rottenTomatoes: "87%",
      metascore: "74",
    });
  });
});
