import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatToolInvocation from "@/components/chat/ChatToolInvocation";
import {
  createMovieDetailsToolPart,
  createSearchToolPart,
  mockChatMovieDetails,
  mockChatSearchOutput,
} from "@/test/fixtures/chat";

describe("ChatToolInvocation", () => {
  it("renders search results when search tool output is available", () => {
    render(
      <ChatToolInvocation
        part={createSearchToolPart() as Extract<
          Parameters<typeof ChatToolInvocation>[0]["part"],
          { type: "tool-searchMovies" }
        >}
      />,
    );

    expect(screen.getByText("Search Movies")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Inception/i })).toBeInTheDocument();
  });

  it("renders movie detail card when details tool output is available", () => {
    render(
      <ChatToolInvocation
        part={createMovieDetailsToolPart() as Extract<
          Parameters<typeof ChatToolInvocation>[0]["part"],
          { type: "tool-getMovieDetails" }
        >}
      />,
    );

    expect(screen.getByRole("heading", { name: mockChatMovieDetails.title })).toBeInTheDocument();
  });

  it("shows error lifecycle when tool execution fails", () => {
    render(
      <ChatToolInvocation
        part={{
          type: "tool-searchMovies",
          toolCallId: "tool-error-1",
          state: "output-error",
          input: { query: "Inception" },
          errorText: "Movie search failed.",
        }}
      />,
    );

    expect(screen.getByText("Tool failed safely")).toBeInTheDocument();
    expect(screen.getByText("Movie search failed.")).toBeInTheDocument();
  });

  it("shows loading lifecycle while tool input streams", () => {
    render(
      <ChatToolInvocation
        part={{
          type: "tool-getMovieDetails",
          toolCallId: "tool-stream-1",
          state: "input-streaming",
          input: { imdbID: "tt1375666" },
        }}
      />,
    );

    expect(screen.getByText("Movie Details")).toBeInTheDocument();
    expect(screen.getByText("Receiving input")).toBeInTheDocument();
    expect(screen.getByText("Building tool request…")).toBeInTheDocument();
  });

  it("forwards movie selection from nested search results", async () => {
    const user = userEvent.setup();
    const onSelectMovie = vi.fn();

    render(
      <ChatToolInvocation
        part={createSearchToolPart(mockChatSearchOutput) as Extract<
          Parameters<typeof ChatToolInvocation>[0]["part"],
          { type: "tool-searchMovies" }
        >}
        onSelectMovie={onSelectMovie}
      />,
    );

    await user.click(screen.getByRole("button", { name: /The Matrix/i }));

    expect(onSelectMovie).toHaveBeenCalledWith("tt0133093");
  });
});
