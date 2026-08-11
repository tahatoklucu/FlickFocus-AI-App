import { render, screen } from "@testing-library/react";
import {
  ChatToolInputAvailable,
  ChatToolInputStreaming,
  ChatToolLifecycleShell,
  ChatToolOutputError,
} from "@/components/chat/ChatToolLifecycle";

describe("ChatToolLifecycle", () => {
  it("renders complete lifecycle shell", () => {
    render(
      <ChatToolLifecycleShell toolName="searchMovies" state="output-available">
        <p>Results ready</p>
      </ChatToolLifecycleShell>,
    );

    expect(screen.getByText("Search Movies")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Results ready")).toBeInTheDocument();
  });

  it("renders streaming input state", () => {
    render(
      <ChatToolInputStreaming
        toolName="searchMovies"
        input={{ query: "Inception" }}
      />,
    );

    expect(screen.getByText("Receiving input")).toBeInTheDocument();
    expect(screen.getByText("query")).toBeInTheDocument();
    expect(screen.getByText("Inception")).toBeInTheDocument();
  });

  it("renders server execution state", () => {
    render(
      <ChatToolInputAvailable
        toolName="getMovieDetails"
        input={{ imdbID: "tt1375666" }}
      />,
    );

    expect(screen.getByText("Movie Details")).toBeInTheDocument();
    expect(screen.getByText("Running on server…")).toBeInTheDocument();
  });

  it("renders safe tool error card", () => {
    render(
      <ChatToolOutputError
        toolName="searchMovies"
        errorText="OMDb request failed"
        input={{ query: "Unknown" }}
      />,
    );

    expect(screen.getByText("Tool failed safely")).toBeInTheDocument();
    expect(screen.getByText("OMDb request failed")).toBeInTheDocument();
  });
});
