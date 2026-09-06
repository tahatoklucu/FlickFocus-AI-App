import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/auth-context.shared";

vi.mock("next/navigation", () => ({
  usePathname: () => "/favorites",
}));

vi.mock("@/context/auth-context.shared", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/auth/AuthModal", () => ({
  default: () => null,
}));

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
  });

  it("links each shelf separately", async () => {
    const user = userEvent.setup();

    render(<Header />);
    await user.click(screen.getByRole("button", { name: "Open profile menu" }));

    expect(screen.getByRole("menuitem", { name: "Favorites" })).toHaveAttribute(
      "href",
      "/favorites",
    );
    expect(screen.getByRole("menuitem", { name: "Watchlist" })).toHaveAttribute(
      "href",
      "/favorites?tab=watchlist",
    );
    expect(screen.getByRole("menuitem", { name: "Watched" })).toHaveAttribute(
      "href",
      "/favorites?tab=watched",
    );
  });

  it("lists plain labels: watched, watchlist, favorites, then account actions", async () => {
    const user = userEvent.setup();

    render(<Header />);
    await user.click(screen.getByRole("button", { name: "Open profile menu" }));

    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual([
      "Watched",
      "Watchlist",
      "Favorites",
      "My Stats",
      "Profile Settings",
      "Sign Out",
    ]);
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
      screen.getByRole("menuitem", { name: "Favorites" }).className,
    ).not.toContain("bg-white/10");
  });
});
