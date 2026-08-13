import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FavoriteButton from "@/components/movies/FavoriteButton";
import { useAuth } from "@/context/auth-context.shared";
import { useFavorites } from "@/context/favorites-context.shared";

vi.mock("@/context/auth-context.shared", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/context/favorites-context.shared", () => ({
  useFavorites: vi.fn(),
}));

const movie = {
  imdbID: "tt1375666",
  title: "Inception",
  year: "2010",
  poster: "https://example.com/poster.jpg",
};

describe("FavoriteButton", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: "user-1" },
      openAuthModal: vi.fn(),
    } as ReturnType<typeof useAuth>);

    vi.mocked(useFavorites).mockReturnValue({
      isFavorite: vi.fn(() => false),
      toggleFavorite: vi.fn(),
      error: null,
    } as ReturnType<typeof useFavorites>);
  });

  it("opens auth modal when user is signed out", async () => {
    const user = userEvent.setup();
    const openAuthModal = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      openAuthModal,
    } as ReturnType<typeof useAuth>);

    render(<FavoriteButton movie={movie} />);

    await user.click(screen.getByRole("button", { name: "Add to favorites" }));

    expect(openAuthModal).toHaveBeenCalledWith("signin");
  });

  it("toggles favorite when user is signed in", async () => {
    const user = userEvent.setup();
    const toggleFavorite = vi.fn();

    vi.mocked(useFavorites).mockReturnValue({
      isFavorite: vi.fn(() => false),
      toggleFavorite,
      error: null,
    } as ReturnType<typeof useFavorites>);

    render(<FavoriteButton movie={movie} />);

    await user.click(screen.getByRole("button", { name: "Add to favorites" }));

    expect(toggleFavorite).toHaveBeenCalledWith(movie);
  });
});