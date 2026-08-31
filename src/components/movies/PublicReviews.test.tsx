import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PublicReviews from "@/components/movies/PublicReviews";
import { useAuth } from "@/context/auth-context.shared";
import type { PublicReview } from "@/types";

vi.mock("@/context/auth-context.shared", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  isFirebaseConfigured: () => true,
}));

const subscribeToPublicReviews = vi.fn();
const reportReview = vi.fn();

vi.mock("@/services/reviews", () => ({
  subscribeToPublicReviews: (
    ...args: Parameters<typeof subscribeToPublicReviews>
  ) => subscribeToPublicReviews(...args),
  reportReview: (...args: Parameters<typeof reportReview>) =>
    reportReview(...args),
}));

function review(overrides: Partial<PublicReview> = {}): PublicReview {
  return {
    userId: "other-1",
    imdbID: "tt1375666",
    displayName: "Elif",
    photoURL: null,
    rating: 8,
    note: "The totem idea stayed with me.",
    publishedAt: "2026-03-03T10:00:00.000Z",
    ...overrides,
  };
}

function setup({
  signedIn,
  reviews,
}: {
  signedIn: boolean;
  reviews: PublicReview[];
}) {
  const openAuthModal = vi.fn();

  vi.mocked(useAuth).mockReturnValue({
    user: signedIn ? { uid: "me" } : null,
    openAuthModal,
  } as unknown as ReturnType<typeof useAuth>);

  subscribeToPublicReviews.mockImplementation(
    (_imdbID: string, onUpdate: (next: PublicReview[]) => void) => {
      onUpdate(reviews);
      return () => {};
    },
  );

  return { openAuthModal };
}

describe("PublicReviews", () => {
  it("leaves out the signed-in user's own review", async () => {
    setup({
      signedIn: true,
      reviews: [review(), review({ userId: "me", note: "Mine." })],
    });

    render(<PublicReviews imdbID="tt1375666" />);

    expect(await screen.findByText("Community reviews (1)")).toBeInTheDocument();
    expect(screen.queryByText("Mine.")).not.toBeInTheDocument();
  });

  it("asks anonymous visitors to sign in before reporting", async () => {
    const user = userEvent.setup();
    const { openAuthModal } = setup({ signedIn: false, reviews: [review()] });

    render(<PublicReviews imdbID="tt1375666" />);

    await user.click(await screen.findByRole("button", { name: /Report the review/ }));
    await user.click(screen.getByRole("button", { name: "Report" }));

    expect(openAuthModal).toHaveBeenCalledWith("signin");
    expect(reportReview).not.toHaveBeenCalled();
  });

  it("hides a reported review after confirmation", async () => {
    const user = userEvent.setup();
    reportReview.mockResolvedValue(undefined);
    setup({ signedIn: true, reviews: [review()] });

    render(<PublicReviews imdbID="tt1375666" />);

    await user.click(await screen.findByRole("button", { name: /Report the review/ }));
    expect(reportReview).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Report" }));

    expect(reportReview).toHaveBeenCalledWith(
      "tt1375666",
      "other-1",
      "me",
      expect.any(String),
    );
    expect(screen.queryByText("The totem idea stayed with me.")).not.toBeInTheDocument();
    expect(screen.getByText(/Thanks for the report/)).toBeInTheDocument();
  });

  it("brings the review back when the report fails", async () => {
    const user = userEvent.setup();
    reportReview.mockRejectedValue(new Error("Network is down."));
    setup({ signedIn: true, reviews: [review()] });

    render(<PublicReviews imdbID="tt1375666" />);

    await user.click(await screen.findByRole("button", { name: /Report the review/ }));
    await user.click(screen.getByRole("button", { name: "Report" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Network is down.");
    expect(screen.getByText("The totem idea stayed with me.")).toBeInTheDocument();
  });
});
