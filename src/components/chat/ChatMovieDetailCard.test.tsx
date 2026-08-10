import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatMovieDetailCard from "@/components/chat/ChatMovieDetailCard";
import { mockChatMovieDetails } from "@/test/fixtures/chat";

describe("ChatMovieDetailCard", () => {
  it("renders title, metadata, ratings, and plot", () => {
    render(<ChatMovieDetailCard output={mockChatMovieDetails} />);

    expect(screen.getByRole("heading", { name: "Inception" })).toBeInTheDocument();
    expect(screen.getByText(/2010 · PG-13 · 148 min/)).toBeInTheDocument();
    expect(screen.getByText("8.8/10")).toBeInTheDocument();
    expect(screen.getByText("87%")).toBeInTheDocument();
    expect(screen.getByText("74")).toBeInTheDocument();
    expect(
      screen.getByText(/A thief who steals corporate secrets/),
    ).toBeInTheDocument();
    expect(screen.getByText("Director")).toBeInTheDocument();
    expect(screen.getByText("Christopher Nolan")).toBeInTheDocument();
    expect(screen.getByText("Cast")).toBeInTheDocument();
  });

  it("renders genre chips", () => {
    render(<ChatMovieDetailCard output={mockChatMovieDetails} />);

    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Sci-Fi")).toBeInTheDocument();
  });

  it("calls onOpenDetails when the details link is clicked", async () => {
    const user = userEvent.setup();
    const onOpenDetails = vi.fn();

    render(
      <ChatMovieDetailCard
        output={mockChatMovieDetails}
        onOpenDetails={onOpenDetails}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Open full details/i }));

    expect(onOpenDetails).toHaveBeenCalledWith("tt1375666");
  });

  it("shows completed lifecycle header", () => {
    render(<ChatMovieDetailCard output={mockChatMovieDetails} />);

    expect(screen.getByText("Movie Details")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });
});
