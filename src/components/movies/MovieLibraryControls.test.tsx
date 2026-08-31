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
  entry?: { rating: number | null; note: string | null };
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

  it("only enables the note button once the text changes", async () => {
    const user = userEvent.setup();
    const updateEntry = vi.fn();
    mockContexts({
      signedIn: true,
      library: { updateEntry, entry: { rating: null, note: "first pass" } },
    });

    render(<MovieLibraryControls movie={movie} />);

    const saveButton = screen.getByRole("button", { name: "Save note" });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText("Your note"), " again");
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);
    expect(updateEntry).toHaveBeenCalledWith(movie, { note: "first pass again" });
  });
});
