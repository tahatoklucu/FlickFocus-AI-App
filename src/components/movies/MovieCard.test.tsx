import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MovieCard from "@/components/movies/MovieCard";

vi.mock("@/components/movies/FavoriteButton", () => ({
  default: () => <button type="button">Favorite</button>,
}));

vi.mock("@/components/movies/MoviePoster", () => ({
  default: ({ title }: { title: string }) => (
    <div data-testid="movie-poster">{title}</div>
  ),
  hasValidPoster: () => true,
}));

const movie = {
  imdbID: "tt1375666",
  Title: "Inception",
  Year: "2010",
  Poster: "https://example.com/poster.jpg",
  Type: "movie",
};

describe("MovieCard", () => {
  it("opens details when card is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<MovieCard movie={movie} onSelect={onSelect} />);

    await user.click(
      screen.getByRole("button", { name: "View details for Inception" }),
    );

    expect(onSelect).toHaveBeenCalledWith("tt1375666");
  });

  it("renders title and year", () => {
    render(<MovieCard movie={movie} onSelect={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Inception" })).toBeInTheDocument();
    expect(screen.getByText("2010")).toBeInTheDocument();
  });
});
