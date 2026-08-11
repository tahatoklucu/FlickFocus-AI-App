import { render, screen, waitFor } from "@testing-library/react";
import MoviePoster, { hasValidPoster } from "@/components/movies/MoviePoster";
import { checkPosterAvailability } from "@/lib/poster/poster-availability.client";

vi.mock("@/lib/poster/poster-availability.client", () => ({
  checkPosterAvailability: vi.fn(),
}));

describe("MoviePoster", () => {
  it("validates poster urls", () => {
    expect(hasValidPoster("https://m.media-amazon.com/images/M/example.jpg")).toBe(
      true,
    );
    expect(hasValidPoster("N/A")).toBe(false);
  });

  it("shows placeholder for invalid poster urls", () => {
    render(<MoviePoster poster="N/A" title="Inception" year="2010" />);

    expect(screen.getByLabelText("Inception poster unavailable")).toBeInTheDocument();
  });

  it("renders image when poster is available", async () => {
    vi.mocked(checkPosterAvailability).mockResolvedValue(true);

    render(
      <MoviePoster
        poster="https://m.media-amazon.com/images/M/example.jpg"
        title="Inception"
        year="2010"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: "Inception poster" }),
      ).toBeInTheDocument();
    });
  });
});
