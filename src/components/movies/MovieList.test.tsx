import { render, screen } from "@testing-library/react";
import MovieList from "@/components/movies/MovieList";

vi.mock("@/components/movies/MovieCard", () => ({
  default: ({ movie }: { movie: { Title: string } }) => (
    <div data-testid="movie-card">{movie.Title}</div>
  ),
}));

const sampleMovie = {
  imdbID: "tt1375666",
  Title: "Inception",
  Year: "2010",
  Poster: "N/A",
  Type: "movie",
};

describe("MovieList", () => {
  it("shows loading state", () => {
    render(
      <MovieList
        movies={[]}
        isLoading
        error={null}
        hasSearched={false}
        onMovieSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Searching movies...")).toBeInTheDocument();
  });

  it("shows error alert", () => {
    render(
      <MovieList
        movies={[]}
        isLoading={false}
        error="OMDb unavailable"
        hasSearched
        onMovieSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("OMDb unavailable");
  });

  it("renders movie cards when results exist", () => {
    render(
      <MovieList
        movies={[sampleMovie]}
        isLoading={false}
        error={null}
        hasSearched
        onMovieSelect={vi.fn()}
      />,
    );

    expect(screen.getByTestId("movie-card")).toHaveTextContent("Inception");
    expect(screen.getByText("1 result found")).toBeInTheDocument();
  });
});
