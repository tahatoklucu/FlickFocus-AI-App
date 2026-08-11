import { render, screen } from "@testing-library/react";
import FavoritesPageClient from "@/components/favorites/FavoritesPageClient";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/context/FavoritesContext", () => ({
  useFavorites: vi.fn(),
}));

vi.mock("@/components/movies/MovieList", () => ({
  default: () => <div data-testid="movie-list">Favorites list</div>,
}));

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
      syncing: false,
      error: null,
      clearError: vi.fn(),
    } as ReturnType<typeof useFavorites>);

    render(<FavoritesPageClient />);

    expect(screen.getByText("Sign in to view your favorites")).toBeInTheDocument();
  });
});
