import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatAssistantMessage, {
  ChatMessageContent,
  ChatUserMessage,
} from "@/components/chat/ChatAssistantMessage";
import {
  createAssistantMessage,
  createMovieDetailsToolPart,
  createSearchToolPart,
  createUserMessage,
  mockChatSearchOutput,
} from "@/test/fixtures/chat";

describe("ChatAssistantMessage", () => {
  it("renders assistant text content", () => {
    const message = createAssistantMessage([
      { type: "text", text: "Inception is a mind-bending sci-fi film." },
    ]);

    render(<ChatAssistantMessage message={message} />);

    expect(
      screen.getByText("Inception is a mind-bending sci-fi film."),
    ).toBeInTheDocument();
  });

  it("shows thinking indicator while streaming without text", () => {
    const message = createAssistantMessage([]);

    render(<ChatAssistantMessage message={message} isStreaming />);

    expect(screen.getByText("Thinking…")).toBeInTheDocument();
  });

  it("renders search tool results from message parts", () => {
    const message = createAssistantMessage([createSearchToolPart()]);

    render(<ChatAssistantMessage message={message} />);

    expect(screen.getByText("Search Movies")).toBeInTheDocument();
    expect(screen.getByText(/2 shown/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Inception/i })).toBeInTheDocument();
  });

  it("calls onSelectMovie when a search result is clicked", async () => {
    const user = userEvent.setup();
    const onSelectMovie = vi.fn();
    const message = createAssistantMessage([createSearchToolPart()]);

    render(
      <ChatAssistantMessage message={message} onSelectMovie={onSelectMovie} />,
    );

    await user.click(screen.getByRole("button", { name: /The Matrix/i }));

    expect(onSelectMovie).toHaveBeenCalledWith("tt0133093");
  });
});

describe("ChatMessageContent", () => {
  it("renders user messages with plain text", () => {
    const message = createUserMessage("Find me a Nolan movie");

    render(<ChatMessageContent message={message} />);

    expect(screen.getByText("Find me a Nolan movie")).toBeInTheDocument();
  });

  it("routes assistant messages to tool and text renderers", () => {
    const message = createAssistantMessage([
      createSearchToolPart(),
      { type: "text", text: "Here are a few matches." },
    ]);

    render(<ChatMessageContent message={message} />);

    expect(screen.getByText("Here are a few matches.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Inception/i })).toBeInTheDocument();
  });
});

describe("ChatUserMessage", () => {
  it("preserves multiline user input", () => {
    const message = createUserMessage("Line one\nLine two");

    render(<ChatUserMessage message={message} />);

    expect(screen.getByText(/Line one/)).toBeInTheDocument();
    expect(screen.getByText(/Line two/)).toBeInTheDocument();
  });
});

describe("ChatAssistantMessage with movie details tool", () => {
  it("renders movie detail card output", () => {
    const message = createAssistantMessage([createMovieDetailsToolPart()]);

    render(<ChatAssistantMessage message={message} />);

    expect(screen.getByText("Movie Details")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inception" })).toBeInTheDocument();
    expect(screen.getByText(/Christopher Nolan/)).toBeInTheDocument();
  });
});

describe("empty search results in assistant message", () => {
  it("shows empty state copy", () => {
    const message = createAssistantMessage([
      createSearchToolPart({
        ...mockChatSearchOutput,
        results: [],
        totalResults: 0,
      }),
    ]);

    render(<ChatAssistantMessage message={message} />);

    expect(screen.getByText("No movies found")).toBeInTheDocument();
  });
});
