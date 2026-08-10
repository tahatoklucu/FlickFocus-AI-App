import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatMovieSearchResults from "@/components/chat/ChatMovieSearchResults";
import { mockChatSearchOutput } from "@/test/fixtures/chat";

describe("ChatMovieSearchResults", () => {
  it("renders query summary and movie cards", () => {
    render(<ChatMovieSearchResults output={mockChatSearchOutput} />);

    expect(screen.getByText("OMDb results")).toBeInTheDocument();
    expect(screen.getByText(/2 shown/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Inception/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /The Matrix/i })).toBeInTheDocument();
  });

  it("shows empty state when no movies match", () => {
    render(
      <ChatMovieSearchResults
        output={{ query: "xyznone", results: [], totalResults: 0 }}
      />,
    );

    expect(screen.getByText("No movies found")).toBeInTheDocument();
    expect(
      screen.getByText("Try a different title or spelling."),
    ).toBeInTheDocument();
  });

  it("notifies parent when a movie card is selected", async () => {
    const user = userEvent.setup();
    const onSelectMovie = vi.fn();

    render(
      <ChatMovieSearchResults
        output={mockChatSearchOutput}
        onSelectMovie={onSelectMovie}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Inception/i }));

    expect(onSelectMovie).toHaveBeenCalledWith("tt1375666");
  });

  it("shows lifecycle header for completed search tool", () => {
    render(<ChatMovieSearchResults output={mockChatSearchOutput} />);

    expect(screen.getByText("Search Movies")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });
});
