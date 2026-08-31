import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MovieLibraryControls from "@/components/movies/MovieLibraryControls";
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

interface LibraryMocks {
  entry?: { rating: number | null; note: string | null; updatedAt?: string };
  toggleFavorite?: () => void;
  toggleWatchlist?: () => void;
  toggleWatched?: () => void;
  updateEntry?: () => void;
  watched?: boolean;
}

function mockContexts({ signedIn, library }: { signedIn: boolean; library: LibraryMocks }) {
  const openAuthModal = vi.fn();

  vi.mocked(useAuth).mockReturnValue({
    user: signedIn ? { uid: "user-1" } : null,
    openAuthModal,
  } as unknown as ReturnType<typeof useAuth>);

  vi.mocked(useFavorites).mockReturnValue({
    getEntry: () => library.entry ?? null,
    isFavorite: () => false,
    isInWatchlist: () => false,
    isWatched: () => library.watched ?? false,
    toggleFavorite: library.toggleFavorite ?? vi.fn(),
    toggleWatchlist: library.toggleWatchlist ?? vi.fn(),
    toggleWatched: library.toggleWatched ?? vi.fn(),
    updateEntry: library.updateEntry ?? vi.fn(),
  } as unknown as ReturnType<typeof useFavorites>);

  return { openAuthModal };
}

describe("MovieLibraryControls", () => {
  it("asks anonymous visitors to sign in instead of writing", async () => {
    const user = userEvent.setup();
    const toggleFavorite = vi.fn();
    const { openAuthModal } = mockContexts({
      signedIn: false,
      library: { toggleFavorite },
    });

    render(<MovieLibraryControls movie={movie} />);
    await user.click(screen.getByRole("button", { name: "Favorite" }));

    expect(openAuthModal).toHaveBeenCalledWith("signin");
    expect(toggleFavorite).not.toHaveBeenCalled();
  });

  it("toggles each shelf for signed-in users", async () => {
    const user = userEvent.setup();
    const toggleFavorite = vi.fn();
    const toggleWatchlist = vi.fn();
    const toggleWatched = vi.fn();
    mockContexts({
      signedIn: true,
      library: { toggleFavorite, toggleWatchlist, toggleWatched },
    });

    render(<MovieLibraryControls movie={movie} />);

    await user.click(screen.getByRole("button", { name: "Favorite" }));
    await user.click(screen.getByRole("button", { name: "Watchlist" }));
    await user.click(screen.getByRole("button", { name: "Mark watched" }));

    expect(toggleFavorite).toHaveBeenCalledWith(movie);
    expect(toggleWatchlist).toHaveBeenCalledWith(movie);
    expect(toggleWatched).toHaveBeenCalledWith(movie);
  });

  it("saves a rating and clears it when the same star is clicked", async () => {
    const user = userEvent.setup();
    const updateEntry = vi.fn();
    mockContexts({
      signedIn: true,
      library: { updateEntry, entry: { rating: 8, note: null } },
    });

    render(<MovieLibraryControls movie={movie} />);

    await user.click(screen.getByRole("radio", { name: "Rate 5 out of 10" }));
    expect(updateEntry).toHaveBeenCalledWith(movie, { rating: 5 });

    await user.click(screen.getByRole("radio", { name: "Rate 8 out of 10" }));
    expect(updateEntry).toHaveBeenCalledWith(movie, { rating: null });
  });

  it("publishes a new review only once something is written", async () => {
    const user = userEvent.setup();
    const updateEntry = vi.fn();
    mockContexts({ signedIn: true, library: { updateEntry } });

    render(<MovieLibraryControls movie={movie} />);

    const publishButton = screen.getByRole("button", { name: "Publish review" });
    expect(publishButton).toBeDisabled();

    await user.type(screen.getByLabelText("Your review"), "  dream logic  ");
    expect(publishButton).toBeEnabled();

    await user.click(publishButton);
    expect(updateEntry).toHaveBeenCalledWith(movie, { note: "  dream logic  " });
  });

  it("shows a published review as read-only until Edit is pressed", async () => {
    const user = userEvent.setup();
    const updateEntry = vi.fn();
    mockContexts({
      signedIn: true,
      library: {
        updateEntry,
        entry: {
          rating: 9,
          note: "Still the best heist movie.",
          updatedAt: "2026-03-04T10:00:00.000Z",
        },
      },
    });

    render(<MovieLibraryControls movie={movie} />);

    expect(screen.getByText("Still the best heist movie.")).toBeInTheDocument();
    expect(screen.getByText(/Published Mar 4, 2026/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Your review")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const editor = screen.getByLabelText("Edit your review");
    expect(editor).toHaveValue("Still the best heist movie.");

    // Leaving the editor without changes restores the published view.
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Edit your review")).not.toBeInTheDocument();
    expect(updateEntry).not.toHaveBeenCalled();
  });

  it("asks for confirmation before removing a review and its rating", async () => {
    const user = userEvent.setup();
    const updateEntry = vi.fn();
    mockContexts({
      signedIn: true,
      library: { updateEntry, entry: { rating: 9, note: "Overrated." } },
    });

    render(<MovieLibraryControls movie={movie} />);

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(updateEntry).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Keep" }));
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(updateEntry).toHaveBeenCalledWith(movie, { note: null, rating: null });
  });
});
