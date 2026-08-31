import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FavoritesPageClient from "@/components/favorites/FavoritesPageClient";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useLibraryShelf } from "@/hooks/useLibraryShelf";
import type { LibraryShelf, UserFavorite } from "@/types";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/context/FavoritesContext", () => ({
  useFavorites: vi.fn(),
}));

vi.mock("@/hooks/useLibraryShelf", () => ({
  useLibraryShelf: vi.fn(),
}));

vi.mock("@/components/movies/MovieList", () => ({
  default: ({ resultLabel }: { resultLabel?: string }) => (
    <div data-testid="movie-list">{resultLabel}</div>
  ),
}));

function entry(imdbID: string): UserFavorite {
  return {
    id: imdbID,
    userId: "user-1",
    imdbID,
    title: imdbID,
    year: "2010",
    poster: "poster.jpg",
    addedAt: "2026-01-01T00:00:00.000Z",
    favorite: true,
    watchlist: false,
    watchedAt: null,
    rating: null,
    note: null,
  };
}

describe("FavoritesPageClient", () => {
  it("prompts signed-out users to sign in", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      isConfigured: true,
      openAuthModal: vi.fn(),
    } as ReturnType<typeof useAuth>);

    vi.mocked(useFavorites).mockReturnValue({
      favorites: [],
      watchlist: [],
      watched: [],
      syncing: false,
      error: null,
      clearError: vi.fn(),
    } as unknown as ReturnType<typeof useFavorites>);

    vi.mocked(useLibraryShelf).mockReturnValue(["favorite", vi.fn()] as const);

    render(<FavoritesPageClient />);

    expect(screen.getByText("Sign in to view your favorites")).toBeInTheDocument();
  });

  it("shows the shelf from the URL with per-shelf counts", async () => {
    const user = userEvent.setup();
    const selectShelf = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      user: { uid: "user-1" },
      loading: false,
      isConfigured: true,
      openAuthModal: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    vi.mocked(useFavorites).mockReturnValue({
      favorites: [entry("tt1"), entry("tt2")],
      watchlist: [entry("tt3")],
      watched: [],
      syncing: false,
      error: null,
      clearError: vi.fn(),
    } as unknown as ReturnType<typeof useFavorites>);

    vi.mocked(useLibraryShelf).mockReturnValue([
      "watchlist" as LibraryShelf,
      selectShelf,
    ] as const);

    render(<FavoritesPageClient />);

    const watchlistTab = screen.getByRole("tab", { name: /watchlist/i });
    expect(watchlistTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /favorites/i })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    // Watchlist holds one movie, so the list reflects that shelf, not favorites.
    expect(screen.getByTestId("movie-list")).toHaveTextContent("1 movie");

    await user.click(screen.getByRole("tab", { name: /watched/i }));
    expect(selectShelf).toHaveBeenCalledWith("watched");
  });
});
