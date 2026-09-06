import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WatchlistButton from "@/components/movies/WatchlistButton";
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

function setup({
  signedIn,
  queued = false,
  watched = false,
}: {
  signedIn: boolean;
  queued?: boolean;
  watched?: boolean;
}) {
  const openAuthModal = vi.fn();
  const toggleWatchlist = vi.fn();

  vi.mocked(useAuth).mockReturnValue({
    user: signedIn ? { uid: "user-1" } : null,
    openAuthModal,
  } as unknown as ReturnType<typeof useAuth>);

  vi.mocked(useFavorites).mockReturnValue({
    isInWatchlist: () => queued,
    isWatched: () => watched,
    toggleWatchlist,
  } as unknown as ReturnType<typeof useFavorites>);

  return { openAuthModal, toggleWatchlist };
}

describe("WatchlistButton", () => {
  it("queues a movie for a signed-in user", async () => {
    const user = userEvent.setup();
    const { toggleWatchlist } = setup({ signedIn: true });

    render(<WatchlistButton movie={movie} />);
    const button = screen.getByRole("button", { name: "Add to watchlist" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);
    expect(toggleWatchlist).toHaveBeenCalledWith(movie);
  });

  it("offers to remove a queued movie", () => {
    setup({ signedIn: true, queued: true });

    render(<WatchlistButton movie={movie} />);

    expect(
      screen.getByRole("button", { name: "Remove from watchlist" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("invites a rewatch for a title already watched", () => {
    setup({ signedIn: true, watched: true });

    render(<WatchlistButton movie={movie} />);

    expect(
      screen.getByRole("button", { name: "Watched — add to watchlist again" }),
    ).toBeInTheDocument();
  });

  it("asks anonymous visitors to sign in instead of writing", async () => {
    const user = userEvent.setup();
    const { openAuthModal, toggleWatchlist } = setup({ signedIn: false });

    render(<WatchlistButton movie={movie} />);
    await user.click(screen.getByRole("button", { name: "Add to watchlist" }));

    expect(openAuthModal).toHaveBeenCalledWith("signin");
    expect(toggleWatchlist).not.toHaveBeenCalled();
  });
});
