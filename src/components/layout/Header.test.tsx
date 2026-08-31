import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/auth-context.shared";
import { useFavorites } from "@/context/favorites-context.shared";
import type { UserFavorite } from "@/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/favorites",
}));

vi.mock("@/context/auth-context.shared", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/context/favorites-context.shared", () => ({
  useFavorites: vi.fn(),
}));

vi.mock("@/components/auth/AuthModal", () => ({
  default: () => null,
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

describe("Header profile menu", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: "user-1", email: "fan@example.com" },
      userProfile: null,
      loading: false,
      isConfigured: true,
      openAuthModal: vi.fn(),
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    vi.mocked(useFavorites).mockReturnValue({
      favorites: [entry("tt1"), entry("tt2")],
      watchlist: [entry("tt3")],
      watched: [],
    } as unknown as ReturnType<typeof useFavorites>);
  });

  it("links each shelf separately with its own count", async () => {
    const user = userEvent.setup();

    render(<Header />);
    await user.click(screen.getByRole("button", { name: "Open profile menu" }));

    expect(screen.getByRole("menuitem", { name: "Favorites, 2 movies" })).toHaveAttribute(
      "href",
      "/favorites",
    );
    expect(screen.getByRole("menuitem", { name: "Watchlist, 1 movie" })).toHaveAttribute(
      "href",
      "/favorites?tab=watchlist",
    );
    // An empty shelf shows no badge, so it keeps its plain label.
    expect(screen.getByRole("menuitem", { name: "Watched" })).toHaveAttribute(
      "href",
      "/favorites?tab=watched",
    );
  });

  it("lists watched first, then watchlist, favorites, and account actions", async () => {
    const user = userEvent.setup();

    render(<Header />);
    await user.click(screen.getByRole("button", { name: "Open profile menu" }));

    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Watched", "Watchlist1", "Favorites2", "Profile Settings", "Sign Out"]);
  });

  it("highlights the shelf the library page is showing", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/favorites?tab=watched");

    render(<Header />);
    await user.click(screen.getByRole("button", { name: "Open profile menu" }));

    expect(screen.getByRole("menuitem", { name: "Watched" }).className).toContain(
      "bg-white/10",
    );
    expect(
      screen.getByRole("menuitem", { name: "Favorites, 2 movies" }).className,
    ).not.toContain("bg-white/10");
  });
});
